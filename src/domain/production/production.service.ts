import type {
  RecipeDTO,
  FactoryDTO,
  ProductionOrderDTO,
  CreateFactoryInput,
  StartProductionInput,
} from "./production.model";
import { createFactorySchema, startProductionSchema } from "./production.validator";
import * as productionRepo from "./production.repository";
import { getPrice, recalculate } from "../pricing/pricing.service";
import { notify } from "../notification/notification.service";

type RepoRecipe = Awaited<ReturnType<typeof productionRepo.findAllRecipes>>[number];
type RepoFactory = Awaited<ReturnType<typeof productionRepo.findFactoriesByOwner>>[number];
type RepoOrder = Awaited<ReturnType<typeof productionRepo.startProductionOrder>>;

export function toRecipeDTO(r: RepoRecipe): RecipeDTO {
  return {
    id: r.id,
    name: r.name,
    outputItemId: r.outputItemId,
    outputItemName: r.outputItemName,
    outputQuantity: r.outputQuantity,
    processingTime: r.processingTime,
    inputs: r.inputs.map((i) => ({
      itemId: i.itemId,
      itemName: i.itemName,
      quantity: i.quantity,
    })),
  };
}

export function toFactoryDTO(f: RepoFactory): FactoryDTO {
  return {
    id: f.id,
    gameServerId: f.gameServerId,
    ownerId: f.ownerId,
    recipeId: f.recipeId,
    recipeName: f.recipe.name,
    name: f.name,
    cyclesRun: f.cyclesRun,
    createdAt: f.createdAt.toISOString(),
  };
}

export function toOrderDTO(o: RepoOrder): ProductionOrderDTO {
  return {
    id: o.id,
    factoryId: o.factoryId,
    cycles: o.cycles,
    status: o.status,
    startedAt: o.startedAt?.toISOString() ?? null,
    completesAt: o.completesAt?.toISOString() ?? null,
    completedAt: o.completedAt?.toISOString() ?? null,
    createdAt: o.createdAt.toISOString(),
  };
}

/** List all available recipes */
export async function getRecipes(): Promise<RecipeDTO[]> {
  const recipes = await productionRepo.findAllRecipes();
  return recipes.map(toRecipeDTO);
}

/** Create a new factory for an owner */
export async function createFactory(
  ownerId: string,
  input: CreateFactoryInput
): Promise<FactoryDTO> {
  const parsed = createFactorySchema.parse(input);

  // Verify recipe exists
  const recipe = await productionRepo.findRecipeById(parsed.recipeId);
  if (!recipe) throw new Error("Recipe not found");

  const factory = await productionRepo.createFactory({
    gameServerId: parsed.gameServerId,
    ownerId,
    recipeId: parsed.recipeId,
    name: parsed.name,
  });

  return toFactoryDTO(factory);
}

/** List factories owned by a user */
export async function getMyFactories(ownerId: string): Promise<FactoryDTO[]> {
  const factories = await productionRepo.findFactoriesByOwner(ownerId);
  return factories.map(toFactoryDTO);
}

/** Get a single factory by ID */
export async function getFactory(factoryId: string): Promise<FactoryDTO | null> {
  const factory = await productionRepo.findFactoryById(factoryId);
  return factory ? toFactoryDTO(factory) : null;
}

/** Start a production run on a factory */
export async function startProduction(
  factoryId: string,
  ownerId: string,
  input: StartProductionInput
): Promise<ProductionOrderDTO> {
  const parsed = startProductionSchema.parse(input);

  // Verify factory exists and is owned by the caller
  const factory = await productionRepo.findFactoryById(factoryId);
  if (!factory) throw new Error("Factory not found");
  if (factory.ownerId !== ownerId) throw new Error("Not the factory owner");

  // Get recipe for processing time calculation
  const recipe = await productionRepo.findRecipeById(factory.recipeId);
  if (!recipe) throw new Error("Recipe not found");

  // Calculate completesAt based on processingTime * cycles
  const totalSeconds = recipe.processingTime * parsed.cycles;
  const completesAt = new Date();
  completesAt.setSeconds(completesAt.getSeconds() + totalSeconds);

  const order = await productionRepo.startProductionOrder(
    factoryId,
    ownerId,
    factory.gameServerId,
    factory.recipeId,
    parsed.cycles,
    completesAt
  );

  return toOrderDTO(order);
}

/** Collect output from a completed production order */
export async function collectOutput(
  orderId: string,
  ownerId: string
): Promise<ProductionOrderDTO> {
  // Get the order with factory info to verify ownership and status
  const orderWithFactory = await productionRepo.findOrderById(orderId);
  if (!orderWithFactory) throw new Error("Order not found");
  if (orderWithFactory.factory.ownerId !== ownerId) throw new Error("Not the factory owner");
  if (orderWithFactory.status !== "completed") throw new Error("Order is not completed");

  // Get recipe output info
  const recipe = await productionRepo.findRecipeById(orderWithFactory.factory.recipeId);
  if (!recipe) throw new Error("Recipe not found");

  // Get current output price
  const price = await getPrice(orderWithFactory.factory.gameServerId, recipe.outputItemId);
  if (!price) throw new Error("No price found for output item");

  const outputValue =
    BigInt(price.currentPrice) * BigInt(recipe.outputQuantity) * BigInt(orderWithFactory.cycles);

  const order = await productionRepo.collectCompletedOrder(
    orderId,
    ownerId,
    outputValue,
    recipe.name,
    orderWithFactory.cycles
  );

  // Fire-and-forget notification
  notify({
    userId: ownerId,
    type: "production_collected",
    title: "Production Collected",
    message: `Collected ${recipe.outputItemName} x${recipe.outputQuantity * orderWithFactory.cycles} from ${orderWithFactory.factory.name}`,
    referenceId: orderId,
  }).catch(() => {});

  // Fire-and-forget price recalculation (production output increases supply)
  recalculate(
    orderWithFactory.factory.gameServerId,
    recipe.outputItemId,
    recipe.outputQuantity * orderWithFactory.cycles,
    0
  ).catch(() => {});

  return toOrderDTO(order);
}

/**
 * Cron job: find processing orders past their completesAt, mark completed, notify owners.
 * Returns the number of orders completed.
 */
export async function completeOrders(): Promise<number> {
  const orders = await productionRepo.findProcessingOrders();
  let count = 0;

  for (const order of orders) {
    await productionRepo.completeOrder(order.id);
    count++;

    // Fire-and-forget notification to the factory owner
    notify({
      userId: order.factory.ownerId,
      type: "production_completed",
      title: "Production Complete",
      message: `Your ${order.factory.recipe.name} factory has finished ${order.cycles} cycle(s). Collect your output!`,
      referenceId: order.id,
    }).catch(() => {});
  }

  return count;
}
