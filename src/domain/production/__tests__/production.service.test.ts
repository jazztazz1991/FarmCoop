import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  toRecipeDTO,
  toFactoryDTO,
  toOrderDTO,
  getRecipes,
  createFactory,
  getMyFactories,
  getFactory,
  startProduction,
  collectOutput,
  completeOrders,
} from "../production.service";

vi.mock("../production.repository", () => ({
  findAllRecipes: vi.fn(),
  findRecipeById: vi.fn(),
  createFactory: vi.fn(),
  findFactoriesByOwner: vi.fn(),
  findFactoriesByServer: vi.fn(),
  findFactoryById: vi.fn(),
  findOrderById: vi.fn(),
  startProductionOrder: vi.fn(),
  collectCompletedOrder: vi.fn(),
  findProcessingOrders: vi.fn(),
  completeOrder: vi.fn(),
}));

vi.mock("../../pricing/pricing.service", () => ({
  getPrice: vi.fn(),
  recalculate: vi.fn().mockResolvedValue(null),
}));

vi.mock("../../notification/notification.service", () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

import * as productionRepo from "../production.repository";
import * as pricingService from "../../pricing/pricing.service";

const mockRepo = productionRepo as unknown as {
  findAllRecipes: ReturnType<typeof vi.fn>;
  findRecipeById: ReturnType<typeof vi.fn>;
  createFactory: ReturnType<typeof vi.fn>;
  findFactoriesByOwner: ReturnType<typeof vi.fn>;
  findFactoriesByServer: ReturnType<typeof vi.fn>;
  findFactoryById: ReturnType<typeof vi.fn>;
  findOrderById: ReturnType<typeof vi.fn>;
  startProductionOrder: ReturnType<typeof vi.fn>;
  collectCompletedOrder: ReturnType<typeof vi.fn>;
  findProcessingOrders: ReturnType<typeof vi.fn>;
  completeOrder: ReturnType<typeof vi.fn>;
};

const mockPricing = pricingService as unknown as {
  getPrice: ReturnType<typeof vi.fn>;
  recalculate: ReturnType<typeof vi.fn>;
};

const OWNER = "user-owner";
const SERVER = "server-1";

function makeRepoRecipe(overrides = {}) {
  return {
    id: "recipe-1",
    name: "Flour Mill",
    outputItemId: "FLOUR",
    outputItemName: "Flour",
    outputQuantity: 10,
    processingTime: 60,
    inputs: [
      { itemId: "WHEAT", itemName: "Wheat", quantity: 5 },
    ],
    ...overrides,
  };
}

function makeRepoFactory(overrides = {}) {
  return {
    id: "factory-1",
    gameServerId: SERVER,
    ownerId: OWNER,
    recipeId: "recipe-1",
    recipe: { name: "Flour Mill" },
    name: "My Flour Mill",
    cyclesRun: 3,
    createdAt: new Date("2026-01-15T00:00:00Z"),
    ...overrides,
  };
}

function makeRepoOrder(overrides = {}) {
  return {
    id: "order-1",
    factoryId: "factory-1",
    cycles: 2,
    status: "processing",
    startedAt: new Date("2026-01-15T10:00:00Z"),
    completesAt: new Date("2026-01-15T10:02:00Z"),
    completedAt: null,
    createdAt: new Date("2026-01-15T10:00:00Z"),
    ...overrides,
  };
}

function makeRepoOrderWithFactory(overrides = {}) {
  return {
    ...makeRepoOrder(),
    factory: {
      id: "factory-1",
      ownerId: OWNER,
      gameServerId: SERVER,
      recipeId: "recipe-1",
      name: "My Flour Mill",
      recipe: { name: "Flour Mill" },
    },
    ...overrides,
  };
}

// ── DTO mappers ─────────────────────────────────────────

describe("toRecipeDTO", () => {
  it("converts a repo recipe to a DTO", () => {
    const dto = toRecipeDTO(makeRepoRecipe());
    expect(dto).toEqual({
      id: "recipe-1",
      name: "Flour Mill",
      outputItemId: "FLOUR",
      outputItemName: "Flour",
      outputQuantity: 10,
      processingTime: 60,
      inputs: [{ itemId: "WHEAT", itemName: "Wheat", quantity: 5 }],
    });
  });

  it("handles multiple inputs", () => {
    const dto = toRecipeDTO(
      makeRepoRecipe({
        inputs: [
          { itemId: "WHEAT", itemName: "Wheat", quantity: 5 },
          { itemId: "WATER", itemName: "Water", quantity: 2 },
        ],
      })
    );
    expect(dto.inputs).toHaveLength(2);
  });
});

describe("toFactoryDTO", () => {
  it("converts a repo factory to a DTO with ISO date", () => {
    const dto = toFactoryDTO(makeRepoFactory());
    expect(dto).toEqual({
      id: "factory-1",
      gameServerId: SERVER,
      ownerId: OWNER,
      recipeId: "recipe-1",
      recipeName: "Flour Mill",
      name: "My Flour Mill",
      cyclesRun: 3,
      createdAt: "2026-01-15T00:00:00.000Z",
    });
  });
});

describe("toOrderDTO", () => {
  it("converts a repo order to a DTO with ISO dates", () => {
    const dto = toOrderDTO(makeRepoOrder());
    expect(dto).toEqual({
      id: "order-1",
      factoryId: "factory-1",
      cycles: 2,
      status: "processing",
      startedAt: "2026-01-15T10:00:00.000Z",
      completesAt: "2026-01-15T10:02:00.000Z",
      completedAt: null,
      createdAt: "2026-01-15T10:00:00.000Z",
    });
  });

  it("handles null dates", () => {
    const dto = toOrderDTO(makeRepoOrder({ startedAt: null, completesAt: null }));
    expect(dto.startedAt).toBeNull();
    expect(dto.completesAt).toBeNull();
  });
});

// ── getRecipes ──────────────────────────────────────────

describe("getRecipes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all recipes as DTOs", async () => {
    mockRepo.findAllRecipes.mockResolvedValue([makeRepoRecipe()]);
    const result = await getRecipes();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Flour Mill");
  });

  it("returns empty array when no recipes exist", async () => {
    mockRepo.findAllRecipes.mockResolvedValue([]);
    const result = await getRecipes();
    expect(result).toEqual([]);
  });
});

// ── createFactory ───────────────────────────────────────

describe("createFactory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates input, verifies recipe, and creates factory", async () => {
    mockRepo.findRecipeById.mockResolvedValue(makeRepoRecipe());
    mockRepo.createFactory.mockResolvedValue(makeRepoFactory());

    const result = await createFactory(OWNER, {
      gameServerId: SERVER,
      recipeId: "recipe-1",
      name: "My Flour Mill",
    });

    expect(mockRepo.findRecipeById).toHaveBeenCalledWith("recipe-1");
    expect(mockRepo.createFactory).toHaveBeenCalledWith({
      gameServerId: SERVER,
      ownerId: OWNER,
      recipeId: "recipe-1",
      name: "My Flour Mill",
    });
    expect(result.recipeName).toBe("Flour Mill");
  });

  it("rejects invalid input (empty name)", async () => {
    await expect(
      createFactory(OWNER, {
        gameServerId: SERVER,
        recipeId: "recipe-1",
        name: "",
      })
    ).rejects.toThrow();
  });

  it("rejects invalid input (missing gameServerId)", async () => {
    await expect(
      createFactory(OWNER, {
        gameServerId: "",
        recipeId: "recipe-1",
        name: "Mill",
      })
    ).rejects.toThrow();
  });

  it("throws when recipe is not found", async () => {
    mockRepo.findRecipeById.mockResolvedValue(null);

    await expect(
      createFactory(OWNER, {
        gameServerId: SERVER,
        recipeId: "nonexistent",
        name: "My Mill",
      })
    ).rejects.toThrow("Recipe not found");
  });
});

// ── getMyFactories ──────────────────────────────────────

describe("getMyFactories", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns factories owned by user as DTOs", async () => {
    mockRepo.findFactoriesByOwner.mockResolvedValue([makeRepoFactory()]);
    const result = await getMyFactories(OWNER);
    expect(result).toHaveLength(1);
    expect(result[0].ownerId).toBe(OWNER);
  });
});

// ── getFactory ──────────────────────────────────────────

describe("getFactory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a single factory DTO", async () => {
    mockRepo.findFactoryById.mockResolvedValue(makeRepoFactory());
    const result = await getFactory("factory-1");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("factory-1");
  });

  it("returns null when not found", async () => {
    mockRepo.findFactoryById.mockResolvedValue(null);
    const result = await getFactory("nonexistent");
    expect(result).toBeNull();
  });
});

// ── startProduction ─────────────────────────────────────

describe("startProduction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates input, checks ownership, calculates completesAt, and starts order", async () => {
    const factory = makeRepoFactory();
    mockRepo.findFactoryById.mockResolvedValue(factory);
    mockRepo.findRecipeById.mockResolvedValue(makeRepoRecipe({ processingTime: 120 }));
    mockRepo.startProductionOrder.mockResolvedValue(makeRepoOrder());

    const result = await startProduction("factory-1", OWNER, { cycles: 3 });

    expect(mockRepo.findFactoryById).toHaveBeenCalledWith("factory-1");
    expect(mockRepo.findRecipeById).toHaveBeenCalledWith("recipe-1");
    expect(mockRepo.startProductionOrder).toHaveBeenCalledWith(
      "factory-1",
      OWNER,
      SERVER,
      "recipe-1",
      3,
      expect.any(Date)
    );
    expect(result.status).toBe("processing");
  });

  it("rejects if caller is not the factory owner", async () => {
    mockRepo.findFactoryById.mockResolvedValue(makeRepoFactory({ ownerId: "other-user" }));

    await expect(
      startProduction("factory-1", OWNER, { cycles: 2 })
    ).rejects.toThrow("Not the factory owner");
  });

  it("rejects if factory is not found", async () => {
    mockRepo.findFactoryById.mockResolvedValue(null);

    await expect(
      startProduction("factory-1", OWNER, { cycles: 2 })
    ).rejects.toThrow("Factory not found");
  });

  it("rejects if recipe is not found", async () => {
    mockRepo.findFactoryById.mockResolvedValue(makeRepoFactory());
    mockRepo.findRecipeById.mockResolvedValue(null);

    await expect(
      startProduction("factory-1", OWNER, { cycles: 2 })
    ).rejects.toThrow("Recipe not found");
  });

  it("rejects invalid cycles (0)", async () => {
    await expect(
      startProduction("factory-1", OWNER, { cycles: 0 })
    ).rejects.toThrow();
  });

  it("rejects invalid cycles (11)", async () => {
    await expect(
      startProduction("factory-1", OWNER, { cycles: 11 })
    ).rejects.toThrow();
  });
});

// ── collectOutput ───────────────────────────────────────

describe("collectOutput", () => {
  beforeEach(() => vi.clearAllMocks());

  it("verifies ownership, calculates output value, credits wallet, and returns DTO", async () => {
    const orderWithFactory = makeRepoOrderWithFactory({ status: "completed" });
    mockRepo.findOrderById.mockResolvedValue(orderWithFactory);
    mockRepo.findRecipeById.mockResolvedValue(makeRepoRecipe());
    mockPricing.getPrice.mockResolvedValue({
      commodityId: "FLOUR",
      commodityName: "Flour",
      basePrice: "50",
      currentPrice: "60",
      supply: 10,
      demand: 5,
      updatedAt: "2026-01-15T00:00:00.000Z",
    });
    const collectedOrder = makeRepoOrder({ status: "completed", completedAt: new Date("2026-01-15T10:02:00Z") });
    mockRepo.collectCompletedOrder.mockResolvedValue(collectedOrder);

    const result = await collectOutput("order-1", OWNER);

    expect(mockRepo.findOrderById).toHaveBeenCalledWith("order-1");
    expect(mockRepo.findRecipeById).toHaveBeenCalledWith("recipe-1");
    expect(mockPricing.getPrice).toHaveBeenCalledWith(SERVER, "FLOUR");
    // outputValue = 60n * 10n * 2n = 1200n
    expect(mockRepo.collectCompletedOrder).toHaveBeenCalledWith(
      "order-1",
      OWNER,
      1200n,
      "Flour Mill",
      2
    );
    expect(result.status).toBe("completed");
  });

  it("rejects if order is not found", async () => {
    mockRepo.findOrderById.mockResolvedValue(null);

    await expect(collectOutput("order-1", OWNER)).rejects.toThrow("Order not found");
  });

  it("rejects if caller is not the factory owner", async () => {
    const orderWithFactory = makeRepoOrderWithFactory({ status: "completed" });
    orderWithFactory.factory.ownerId = "other-user";
    mockRepo.findOrderById.mockResolvedValue(orderWithFactory);

    await expect(collectOutput("order-1", OWNER)).rejects.toThrow("Not the factory owner");
  });

  it("rejects if order is not completed", async () => {
    mockRepo.findOrderById.mockResolvedValue(makeRepoOrderWithFactory({ status: "processing" }));

    await expect(collectOutput("order-1", OWNER)).rejects.toThrow("Order is not completed");
  });
});

// ── completeOrders ──────────────────────────────────────

describe("completeOrders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("completes processing orders past their completesAt and returns count", async () => {
    mockRepo.findProcessingOrders.mockResolvedValue([
      {
        id: "order-1",
        factoryId: "factory-1",
        cycles: 2,
        status: "processing",
        startedAt: new Date(),
        completesAt: new Date("2026-01-01"),
        completedAt: null,
        createdAt: new Date(),
        factory: {
          id: "factory-1",
          ownerId: OWNER,
          gameServerId: SERVER,
          recipe: { name: "Flour Mill", outputItemId: "FLOUR", outputItemName: "Flour", outputQuantity: 10 },
        },
      },
      {
        id: "order-2",
        factoryId: "factory-2",
        cycles: 1,
        status: "processing",
        startedAt: new Date(),
        completesAt: new Date("2026-01-01"),
        completedAt: null,
        createdAt: new Date(),
        factory: {
          id: "factory-2",
          ownerId: "user-2",
          gameServerId: SERVER,
          recipe: { name: "Bakery", outputItemId: "BREAD", outputItemName: "Bread", outputQuantity: 5 },
        },
      },
    ]);
    mockRepo.completeOrder.mockResolvedValue({});

    const count = await completeOrders();

    expect(count).toBe(2);
    expect(mockRepo.completeOrder).toHaveBeenCalledTimes(2);
    expect(mockRepo.completeOrder).toHaveBeenCalledWith("order-1");
    expect(mockRepo.completeOrder).toHaveBeenCalledWith("order-2");
  });

  it("returns 0 when no orders are due", async () => {
    mockRepo.findProcessingOrders.mockResolvedValue([]);
    const count = await completeOrders();
    expect(count).toBe(0);
  });
});
