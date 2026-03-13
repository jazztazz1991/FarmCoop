import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding recipes...");

  // ── Sawmill: Logs → Planks ─────────────────────────────
  const sawmill = await prisma.recipe.upsert({
    where: { id: "recipe-sawmill" },
    update: {},
    create: {
      id: "recipe-sawmill",
      name: "Sawmill",
      outputItemId: "PLANKS",
      outputItemName: "Planks",
      outputQuantity: 5,
      processingTime: 300, // 5 minutes
      inputs: {
        create: [
          { id: "input-sawmill-logs", itemId: "LOGS", itemName: "Logs", quantity: 10 },
        ],
      },
    },
  });
  console.log(`  Created recipe: ${sawmill.name}`);

  // ── Flour Mill: Wheat → Flour ──────────────────────────
  const flourMill = await prisma.recipe.upsert({
    where: { id: "recipe-flour-mill" },
    update: {},
    create: {
      id: "recipe-flour-mill",
      name: "Flour Mill",
      outputItemId: "FLOUR",
      outputItemName: "Flour",
      outputQuantity: 8,
      processingTime: 240, // 4 minutes
      inputs: {
        create: [
          { id: "input-flour-wheat", itemId: "WHEAT", itemName: "Wheat", quantity: 12 },
        ],
      },
    },
  });
  console.log(`  Created recipe: ${flourMill.name}`);

  // ── Dairy: Milk → Butter ───────────────────────────────
  const dairy = await prisma.recipe.upsert({
    where: { id: "recipe-dairy" },
    update: {},
    create: {
      id: "recipe-dairy",
      name: "Dairy",
      outputItemId: "BUTTER",
      outputItemName: "Butter",
      outputQuantity: 4,
      processingTime: 360, // 6 minutes
      inputs: {
        create: [
          { id: "input-dairy-milk", itemId: "MILK", itemName: "Milk", quantity: 8 },
        ],
      },
    },
  });
  console.log(`  Created recipe: ${dairy.name}`);

  // ── Bakery: Flour + Sugar → Bread ─────────────────────
  const bakery = await prisma.recipe.upsert({
    where: { id: "recipe-bakery" },
    update: {},
    create: {
      id: "recipe-bakery",
      name: "Bakery",
      outputItemId: "BREAD",
      outputItemName: "Bread",
      outputQuantity: 6,
      processingTime: 480, // 8 minutes
      inputs: {
        create: [
          { id: "input-bakery-flour", itemId: "FLOUR", itemName: "Flour", quantity: 5 },
          { id: "input-bakery-sugar", itemId: "SUGAR", itemName: "Sugar", quantity: 3 },
        ],
      },
    },
  });
  console.log(`  Created recipe: ${bakery.name}`);

  // ── Oil Press: Sunflowers → Sunflower Oil ──────────────
  const oilPress = await prisma.recipe.upsert({
    where: { id: "recipe-oil-press" },
    update: {},
    create: {
      id: "recipe-oil-press",
      name: "Oil Press",
      outputItemId: "SUNFLOWER_OIL",
      outputItemName: "Sunflower Oil",
      outputQuantity: 3,
      processingTime: 300, // 5 minutes
      inputs: {
        create: [
          { id: "input-oil-sunflowers", itemId: "SUNFLOWERS", itemName: "Sunflowers", quantity: 15 },
        ],
      },
    },
  });
  console.log(`  Created recipe: ${oilPress.name}`);

  // ── Sugar Mill: Sugar Beet → Sugar ─────────────────────
  const sugarMill = await prisma.recipe.upsert({
    where: { id: "recipe-sugar-mill" },
    update: {},
    create: {
      id: "recipe-sugar-mill",
      name: "Sugar Mill",
      outputItemId: "SUGAR",
      outputItemName: "Sugar",
      outputQuantity: 6,
      processingTime: 360, // 6 minutes
      inputs: {
        create: [
          { id: "input-sugar-beet", itemId: "SUGAR_BEET", itemName: "Sugar Beet", quantity: 10 },
        ],
      },
    },
  });
  console.log(`  Created recipe: ${sugarMill.name}`);

  // ── Spinnery: Cotton → Fabric ──────────────────────────
  const spinnery = await prisma.recipe.upsert({
    where: { id: "recipe-spinnery" },
    update: {},
    create: {
      id: "recipe-spinnery",
      name: "Spinnery",
      outputItemId: "FABRIC",
      outputItemName: "Fabric",
      outputQuantity: 4,
      processingTime: 420, // 7 minutes
      inputs: {
        create: [
          { id: "input-spinnery-cotton", itemId: "COTTON", itemName: "Cotton", quantity: 8 },
        ],
      },
    },
  });
  console.log(`  Created recipe: ${spinnery.name}`);

  // ── Carpentry: Planks + Fabric → Furniture ─────────────
  const carpentry = await prisma.recipe.upsert({
    where: { id: "recipe-carpentry" },
    update: {},
    create: {
      id: "recipe-carpentry",
      name: "Carpentry",
      outputItemId: "FURNITURE",
      outputItemName: "Furniture",
      outputQuantity: 2,
      processingTime: 600, // 10 minutes
      inputs: {
        create: [
          { id: "input-carp-planks", itemId: "PLANKS", itemName: "Planks", quantity: 6 },
          { id: "input-carp-fabric", itemId: "FABRIC", itemName: "Fabric", quantity: 3 },
        ],
      },
    },
  });
  console.log(`  Created recipe: ${carpentry.name}`);

  console.log(`\nSeeded 8 recipes with production chains:`);
  console.log(`  Raw:    Logs, Wheat, Milk, Sunflowers, Sugar Beet, Cotton`);
  console.log(`  Stage 1: Planks, Flour, Butter, Sunflower Oil, Sugar, Fabric`);
  console.log(`  Stage 2: Bread (Flour+Sugar), Furniture (Planks+Fabric)`);

  // ── Default Game Server ──────────────────────────────────
  console.log("\nSeeding default game server...");
  const server = await prisma.gameServer.upsert({
    where: { id: "server-default" },
    update: {},
    create: {
      id: "server-default",
      name: "Default Server",
      transportType: "local",
      transportConfig: {},
    },
  });
  console.log(`  Created server: ${server.name}`);

  // ── Commodity Prices ─────────────────────────────────────
  console.log("\nSeeding commodity prices...");

  const commodities = [
    // Raw materials
    { commodityId: "LOGS", commodityName: "Logs", basePrice: 50n },
    { commodityId: "WHEAT", commodityName: "Wheat", basePrice: 30n },
    { commodityId: "MILK", commodityName: "Milk", basePrice: 40n },
    { commodityId: "SUNFLOWERS", commodityName: "Sunflowers", basePrice: 25n },
    { commodityId: "SUGAR_BEET", commodityName: "Sugar Beet", basePrice: 20n },
    { commodityId: "COTTON", commodityName: "Cotton", basePrice: 35n },
    // Stage 1 products
    { commodityId: "PLANKS", commodityName: "Planks", basePrice: 120n },
    { commodityId: "FLOUR", commodityName: "Flour", basePrice: 80n },
    { commodityId: "BUTTER", commodityName: "Butter", basePrice: 150n },
    { commodityId: "SUNFLOWER_OIL", commodityName: "Sunflower Oil", basePrice: 180n },
    { commodityId: "SUGAR", commodityName: "Sugar", basePrice: 60n },
    { commodityId: "FABRIC", commodityName: "Fabric", basePrice: 140n },
    // Stage 2 products
    { commodityId: "BREAD", commodityName: "Bread", basePrice: 250n },
    { commodityId: "FURNITURE", commodityName: "Furniture", basePrice: 500n },
  ];

  for (const c of commodities) {
    await prisma.commodityPrice.upsert({
      where: {
        gameServerId_commodityId: {
          gameServerId: server.id,
          commodityId: c.commodityId,
        },
      },
      update: {},
      create: {
        gameServerId: server.id,
        commodityId: c.commodityId,
        commodityName: c.commodityName,
        basePrice: c.basePrice,
        currentPrice: c.basePrice,
      },
    });
    console.log(`  ${c.commodityName}: $${c.basePrice}`);
  }

  console.log(`\nSeeded ${commodities.length} commodity prices for ${server.name}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
