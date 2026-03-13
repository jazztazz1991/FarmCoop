import { prisma } from "@/lib/prisma";

const recipeSelect = {
  id: true,
  name: true,
  outputItemId: true,
  outputItemName: true,
  outputQuantity: true,
  processingTime: true,
  inputs: {
    select: {
      itemId: true,
      itemName: true,
      quantity: true,
    },
  },
} as const;

const factorySelect = {
  id: true,
  gameServerId: true,
  ownerId: true,
  recipeId: true,
  recipe: { select: { name: true } },
  name: true,
  cyclesRun: true,
  createdAt: true,
} as const;

const orderSelect = {
  id: true,
  factoryId: true,
  cycles: true,
  status: true,
  startedAt: true,
  completesAt: true,
  completedAt: true,
  createdAt: true,
} as const;

export async function findAllRecipes() {
  return prisma.recipe.findMany({
    select: recipeSelect,
    orderBy: { name: "asc" },
  });
}

export async function findRecipeById(id: string) {
  return prisma.recipe.findUnique({
    where: { id },
    select: recipeSelect,
  });
}

export async function createFactory(data: {
  gameServerId: string;
  ownerId: string;
  recipeId: string;
  name: string;
}) {
  return prisma.factory.create({
    data: {
      gameServerId: data.gameServerId,
      ownerId: data.ownerId,
      recipeId: data.recipeId,
      name: data.name,
    },
    select: factorySelect,
  });
}

export async function findFactoriesByOwner(ownerId: string) {
  return prisma.factory.findMany({
    where: { ownerId },
    select: factorySelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findFactoriesByServer(gameServerId: string) {
  return prisma.factory.findMany({
    where: { gameServerId },
    select: factorySelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findFactoryById(id: string) {
  return prisma.factory.findUnique({
    where: { id },
    select: {
      ...factorySelect,
      orders: {
        select: orderSelect,
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Atomically start a production order:
 * 1. Get recipe with inputs
 * 2. For each input, get current price from CommodityPrice
 * 3. Calculate total input cost = sum(inputPrice * inputQty * cycles)
 * 4. Debit owner's wallet
 * 5. Create the production order
 * 6. Create ledger entry (production_input_cost)
 */
export async function startProductionOrder(
  factoryId: string,
  ownerId: string,
  gameServerId: string,
  recipeId: string,
  cycles: number,
  completesAt: Date
) {
  return prisma.$transaction(async (tx) => {
    // 1. Get recipe with inputs
    const recipe = await tx.recipe.findUnique({
      where: { id: recipeId },
      select: {
        name: true,
        inputs: { select: { itemId: true, itemName: true, quantity: true } },
      },
    });
    if (!recipe) throw new Error("Recipe not found");

    // 2. For each input, get current price
    let totalCost = 0n;
    for (const input of recipe.inputs) {
      const price = await tx.commodityPrice.findUnique({
        where: {
          gameServerId_commodityId: {
            gameServerId,
            commodityId: input.itemId,
          },
        },
        select: { currentPrice: true },
      });
      if (!price) throw new Error(`No price found for input: ${input.itemName}`);

      // 3. Calculate cost for this input
      totalCost += price.currentPrice * BigInt(input.quantity) * BigInt(cycles);
    }

    // 4. Debit owner's wallet
    const wallet = await tx.wallet.upsert({
      where: { userId: ownerId },
      create: { userId: ownerId },
      update: {},
      select: { id: true, balance: true },
    });

    const newBalance = wallet.balance - totalCost;
    if (newBalance < 0n) {
      throw new Error("Insufficient balance");
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    // 5. Create the production order
    const order = await tx.productionOrder.create({
      data: {
        factoryId,
        cycles,
        status: "processing",
        startedAt: new Date(),
        completesAt,
      },
      select: orderSelect,
    });

    // 6. Create ledger entry
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: -totalCost,
        type: "production_input_cost",
        description: `Production input cost: ${recipe.name} x${cycles} cycles`,
        referenceId: order.id,
      },
    });

    return order;
  });
}

/**
 * Atomically collect a completed production order:
 * 1. Get the factory's recipe output
 * 2. Credit owner's wallet with outputValue
 * 3. Create ledger entry (production_output_sale)
 * 4. Mark order completed
 * 5. Increment factory cyclesRun
 */
export async function collectCompletedOrder(
  orderId: string,
  ownerId: string,
  outputValue: bigint,
  recipeName: string,
  cycles: number
) {
  return prisma.$transaction(async (tx) => {
    // Credit owner's wallet
    const wallet = await tx.wallet.upsert({
      where: { userId: ownerId },
      create: { userId: ownerId },
      update: {},
      select: { id: true, balance: true },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance + outputValue },
    });

    // Create ledger entry
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: outputValue,
        type: "production_output_sale",
        description: `Production output: ${recipeName} x${cycles} cycles`,
        referenceId: orderId,
      },
    });

    // Mark order completed
    const order = await tx.productionOrder.update({
      where: { id: orderId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
      select: {
        ...orderSelect,
        factory: { select: { id: true } },
      },
    });

    // Increment factory cyclesRun
    await tx.factory.update({
      where: { id: order.factory.id },
      data: { cyclesRun: { increment: cycles } },
    });

    return {
      id: order.id,
      factoryId: order.factoryId,
      cycles: order.cycles,
      status: order.status,
      startedAt: order.startedAt,
      completesAt: order.completesAt,
      completedAt: order.completedAt,
      createdAt: order.createdAt,
    };
  });
}

/** Find an order by ID with factory context */
export async function findOrderById(orderId: string) {
  return prisma.productionOrder.findUnique({
    where: { id: orderId },
    select: {
      ...orderSelect,
      factory: {
        select: {
          id: true,
          ownerId: true,
          gameServerId: true,
          recipeId: true,
          name: true,
          recipe: { select: { name: true } },
        },
      },
    },
  });
}

/** Find processing orders that have passed their completesAt time */
export async function findProcessingOrders() {
  return prisma.productionOrder.findMany({
    where: {
      status: "processing",
      completesAt: { lte: new Date() },
    },
    select: {
      ...orderSelect,
      factory: {
        select: {
          id: true,
          ownerId: true,
          gameServerId: true,
          recipe: {
            select: {
              name: true,
              outputItemId: true,
              outputItemName: true,
              outputQuantity: true,
            },
          },
        },
      },
    },
  });
}

/** Mark a single order as completed */
export async function completeOrder(orderId: string) {
  return prisma.productionOrder.update({
    where: { id: orderId },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
    select: orderSelect,
  });
}
