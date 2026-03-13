import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setBasePrice,
  getPrices,
  getPrice,
  getPriceHistory,
  recalculate,
  snapshotPrices,
  toDTO,
} from "../pricing.service";

vi.mock("../pricing.repository", () => ({
  upsertCommodityPrice: vi.fn(),
  findPricesByServer: vi.fn(),
  findPrice: vi.fn(),
  updateSupplyDemand: vi.fn(),
  recordPriceHistory: vi.fn(),
  findPriceHistory: vi.fn(),
}));

vi.mock("../pricing.engine", () => ({
  calculatePrice: vi.fn(),
}));

import * as pricingRepo from "../pricing.repository";
import { calculatePrice } from "../pricing.engine";

const mockRepo = pricingRepo as unknown as {
  upsertCommodityPrice: ReturnType<typeof vi.fn>;
  findPricesByServer: ReturnType<typeof vi.fn>;
  findPrice: ReturnType<typeof vi.fn>;
  updateSupplyDemand: ReturnType<typeof vi.fn>;
  recordPriceHistory: ReturnType<typeof vi.fn>;
  findPriceHistory: ReturnType<typeof vi.fn>;
};
const mockCalculate = calculatePrice as ReturnType<typeof vi.fn>;

const SERVER = "server-1";
const COMMODITY = "wheat";

function makeRepoPrice(overrides = {}) {
  return {
    id: "price-1",
    gameServerId: SERVER,
    commodityId: COMMODITY,
    commodityName: "Wheat",
    basePrice: 1000n,
    currentPrice: 1200n,
    supply: 10,
    demand: 15,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("toDTO", () => {
  it("converts repo price to DTO with string BigInts and ISO date", () => {
    const dto = toDTO(makeRepoPrice());
    expect(dto).toEqual({
      commodityId: COMMODITY,
      commodityName: "Wheat",
      basePrice: "1000",
      currentPrice: "1200",
      supply: 10,
      demand: 15,
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  });
});

describe("setBasePrice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates input, calculates price, and upserts", async () => {
    mockCalculate.mockReturnValue(500n);
    mockRepo.upsertCommodityPrice.mockResolvedValue(
      makeRepoPrice({ basePrice: 500n, currentPrice: 500n })
    );

    const result = await setBasePrice(SERVER, {
      commodityId: COMMODITY,
      commodityName: "Wheat",
      basePrice: 500,
    });

    expect(mockCalculate).toHaveBeenCalledWith(500n, 0, 0);
    expect(mockRepo.upsertCommodityPrice).toHaveBeenCalledWith({
      gameServerId: SERVER,
      commodityId: COMMODITY,
      commodityName: "Wheat",
      basePrice: 500n,
      currentPrice: 500n,
    });
    expect(result.basePrice).toBe("500");
  });

  it("rejects invalid input (negative base price)", async () => {
    await expect(
      setBasePrice(SERVER, {
        commodityId: COMMODITY,
        commodityName: "Wheat",
        basePrice: -100,
      })
    ).rejects.toThrow();
  });

  it("rejects invalid input (empty commodity ID)", async () => {
    await expect(
      setBasePrice(SERVER, {
        commodityId: "",
        commodityName: "Wheat",
        basePrice: 100,
      })
    ).rejects.toThrow();
  });
});

describe("getPrices", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all prices for a server as DTOs", async () => {
    mockRepo.findPricesByServer.mockResolvedValue([
      makeRepoPrice(),
      makeRepoPrice({ commodityId: "corn", commodityName: "Corn" }),
    ]);

    const result = await getPrices(SERVER);
    expect(result).toHaveLength(2);
    expect(result[0].commodityId).toBe(COMMODITY);
    expect(result[1].commodityId).toBe("corn");
  });

  it("returns empty array when no prices exist", async () => {
    mockRepo.findPricesByServer.mockResolvedValue([]);
    const result = await getPrices(SERVER);
    expect(result).toEqual([]);
  });
});

describe("getPrice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a single price DTO", async () => {
    mockRepo.findPrice.mockResolvedValue(makeRepoPrice());
    const result = await getPrice(SERVER, COMMODITY);
    expect(result).not.toBeNull();
    expect(result!.commodityId).toBe(COMMODITY);
  });

  it("returns null when commodity not found", async () => {
    mockRepo.findPrice.mockResolvedValue(null);
    const result = await getPrice(SERVER, "nonexistent");
    expect(result).toBeNull();
  });
});

describe("getPriceHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns history entries as DTOs", async () => {
    mockRepo.findPriceHistory.mockResolvedValue([
      { price: 1200n, supply: 10, demand: 15, recordedAt: new Date("2026-01-01T00:00:00Z") },
      { price: 1100n, supply: 12, demand: 14, recordedAt: new Date("2025-12-31T00:00:00Z") },
    ]);

    const result = await getPriceHistory(SERVER, COMMODITY);
    expect(result).toHaveLength(2);
    expect(result[0].price).toBe("1200");
    expect(result[0].recordedAt).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("recalculate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recalculates price based on new supply/demand", async () => {
    mockRepo.findPrice.mockResolvedValue(makeRepoPrice());
    mockCalculate.mockReturnValue(1300n);
    mockRepo.updateSupplyDemand.mockResolvedValue(
      makeRepoPrice({ currentPrice: 1300n, supply: 20, demand: 25 })
    );

    const result = await recalculate(SERVER, COMMODITY, 20, 25);
    expect(mockCalculate).toHaveBeenCalledWith(1000n, 20, 25);
    expect(mockRepo.updateSupplyDemand).toHaveBeenCalledWith(
      SERVER, COMMODITY, 20, 25, 1300n
    );
    expect(result).not.toBeNull();
    expect(result!.currentPrice).toBe("1300");
  });

  it("returns null when commodity does not exist", async () => {
    mockRepo.findPrice.mockResolvedValue(null);
    const result = await recalculate(SERVER, "nonexistent", 5, 10);
    expect(result).toBeNull();
    expect(mockCalculate).not.toHaveBeenCalled();
  });
});

describe("snapshotPrices", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records history for all server prices", async () => {
    const prices = [
      makeRepoPrice(),
      makeRepoPrice({ commodityId: "corn", commodityName: "Corn", currentPrice: 800n }),
    ];
    mockRepo.findPricesByServer.mockResolvedValue(prices);
    mockRepo.recordPriceHistory.mockResolvedValue({});

    const count = await snapshotPrices(SERVER);
    expect(count).toBe(2);
    expect(mockRepo.recordPriceHistory).toHaveBeenCalledTimes(2);
    expect(mockRepo.recordPriceHistory).toHaveBeenCalledWith({
      gameServerId: SERVER,
      commodityId: COMMODITY,
      price: 1200n,
      supply: 10,
      demand: 15,
    });
  });

  it("returns 0 when no prices exist", async () => {
    mockRepo.findPricesByServer.mockResolvedValue([]);
    const count = await snapshotPrices(SERVER);
    expect(count).toBe(0);
    expect(mockRepo.recordPriceHistory).not.toHaveBeenCalled();
  });
});
