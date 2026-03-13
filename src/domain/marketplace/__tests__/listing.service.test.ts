import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createListing,
  searchListings,
  getListingById,
  getMyListings,
  cancelListing,
  buyListing,
  expireListings,
  toDTO,
} from "../listing.service";

vi.mock("../listing.repository", () => ({
  createListing: vi.fn(),
  findActiveListings: vi.fn(),
  findListingById: vi.fn(),
  findListingsBySeller: vi.fn(),
  updateListingStatus: vi.fn(),
  atomicBuyListing: vi.fn(),
  expireListings: vi.fn(),
}));

vi.mock("../../notification/notification.service", () => ({
  notify: vi.fn().mockResolvedValue({}),
}));

import * as listingRepo from "../listing.repository";

const now = new Date("2026-01-15T12:00:00Z");

function makeListing(overrides: Record<string, unknown> = {}) {
  return {
    id: "listing-1",
    sellerId: "seller-1",
    buyerId: null,
    type: "commodity",
    itemId: "wheat",
    itemName: "Wheat",
    quantity: 100,
    pricePerUnit: 500n,
    status: "active",
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
    seller: { displayName: "FarmerJoe" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toDTO", () => {
  it("converts a listing to DTO with computed totalPrice", () => {
    const listing = makeListing();
    const dto = toDTO(listing as any);

    expect(dto.id).toBe("listing-1");
    expect(dto.sellerId).toBe("seller-1");
    expect(dto.sellerName).toBe("FarmerJoe");
    expect(dto.type).toBe("commodity");
    expect(dto.itemName).toBe("Wheat");
    expect(dto.quantity).toBe(100);
    expect(dto.pricePerUnit).toBe("500");
    expect(dto.totalPrice).toBe("50000");
    expect(dto.status).toBe("active");
    expect(dto.expiresAt).toBeNull();
    expect(dto.createdAt).toBe(now.toISOString());
  });

  it("includes expiresAt when set", () => {
    const expires = new Date("2026-02-01");
    const listing = makeListing({ expiresAt: expires });
    const dto = toDTO(listing as any);
    expect(dto.expiresAt).toBe(expires.toISOString());
  });
});

describe("createListing", () => {
  it("validates input and creates a listing", async () => {
    const created = makeListing();
    vi.mocked(listingRepo.createListing).mockResolvedValue(created as any);

    const dto = await createListing("seller-1", {
      type: "commodity",
      itemId: "wheat",
      itemName: "Wheat",
      quantity: 100,
      pricePerUnit: 500,
    });

    expect(listingRepo.createListing).toHaveBeenCalledWith({
      sellerId: "seller-1",
      type: "commodity",
      itemId: "wheat",
      itemName: "Wheat",
      quantity: 100,
      pricePerUnit: 500n,
    });
    expect(dto.id).toBe("listing-1");
    expect(dto.totalPrice).toBe("50000");
  });

  it("rejects invalid input", async () => {
    await expect(
      createListing("seller-1", {
        type: "invalid" as any,
        itemId: "",
        itemName: "",
        quantity: 0,
        pricePerUnit: -1,
      })
    ).rejects.toThrow();
  });
});

describe("searchListings", () => {
  it("returns active listings as DTOs", async () => {
    vi.mocked(listingRepo.findActiveListings).mockResolvedValue([
      makeListing() as any,
    ]);

    const results = await searchListings();
    expect(results).toHaveLength(1);
    expect(results[0].itemName).toBe("Wheat");
  });

  it("passes filter options through", async () => {
    vi.mocked(listingRepo.findActiveListings).mockResolvedValue([]);

    await searchListings({ type: "equipment", search: "tractor", limit: 10, offset: 5 });
    expect(listingRepo.findActiveListings).toHaveBeenCalledWith({
      type: "equipment",
      search: "tractor",
      limit: 10,
      offset: 5,
    });
  });
});

describe("getListingById", () => {
  it("returns DTO when found", async () => {
    vi.mocked(listingRepo.findListingById).mockResolvedValue(makeListing() as any);
    const dto = await getListingById("listing-1");
    expect(dto).not.toBeNull();
    expect(dto!.id).toBe("listing-1");
  });

  it("returns null when not found", async () => {
    vi.mocked(listingRepo.findListingById).mockResolvedValue(null);
    const dto = await getListingById("nonexistent");
    expect(dto).toBeNull();
  });
});

describe("getMyListings", () => {
  it("returns seller listings as DTOs", async () => {
    vi.mocked(listingRepo.findListingsBySeller).mockResolvedValue([
      makeListing() as any,
      makeListing({ id: "listing-2", itemName: "Barley" }) as any,
    ]);

    const results = await getMyListings("seller-1");
    expect(results).toHaveLength(2);
  });
});

describe("cancelListing", () => {
  it("cancels an active listing owned by the user", async () => {
    vi.mocked(listingRepo.findListingById).mockResolvedValue(makeListing() as any);
    vi.mocked(listingRepo.updateListingStatus).mockResolvedValue(
      makeListing({ status: "cancelled" }) as any
    );

    const dto = await cancelListing("seller-1", "listing-1");
    expect(listingRepo.updateListingStatus).toHaveBeenCalledWith("listing-1", "cancelled");
    expect(dto.status).toBe("cancelled");
  });

  it("rejects if listing not found", async () => {
    vi.mocked(listingRepo.findListingById).mockResolvedValue(null);
    await expect(cancelListing("seller-1", "listing-x")).rejects.toThrow("Listing not found");
  });

  it("rejects if not the seller", async () => {
    vi.mocked(listingRepo.findListingById).mockResolvedValue(makeListing() as any);
    await expect(cancelListing("other-user", "listing-1")).rejects.toThrow("Not your listing");
  });

  it("rejects if listing is not active", async () => {
    vi.mocked(listingRepo.findListingById).mockResolvedValue(
      makeListing({ status: "sold" }) as any
    );
    await expect(cancelListing("seller-1", "listing-1")).rejects.toThrow("Listing is not active");
  });
});

describe("buyListing", () => {
  it("calls atomicBuyListing with correct args", async () => {
    vi.mocked(listingRepo.findListingById).mockResolvedValue(makeListing() as any);
    vi.mocked(listingRepo.atomicBuyListing).mockResolvedValue(
      makeListing({ status: "sold", buyerId: "buyer-1" }) as any
    );

    const dto = await buyListing("buyer-1", "listing-1");

    expect(listingRepo.atomicBuyListing).toHaveBeenCalledWith(
      "listing-1",
      "buyer-1",
      "seller-1",
      50000n,
      "Wheat",
      100
    );
    expect(dto.status).toBe("sold");
  });

  it("rejects if listing not found", async () => {
    vi.mocked(listingRepo.findListingById).mockResolvedValue(null);
    await expect(buyListing("buyer-1", "listing-x")).rejects.toThrow("Listing not found");
  });

  it("rejects if listing is not active", async () => {
    vi.mocked(listingRepo.findListingById).mockResolvedValue(
      makeListing({ status: "sold" }) as any
    );
    await expect(buyListing("buyer-1", "listing-1")).rejects.toThrow("Listing is not active");
  });

  it("rejects if buyer is the seller", async () => {
    vi.mocked(listingRepo.findListingById).mockResolvedValue(makeListing() as any);
    await expect(buyListing("seller-1", "listing-1")).rejects.toThrow("Cannot buy your own listing");
  });

  it("propagates insufficient balance error from atomic buy", async () => {
    vi.mocked(listingRepo.findListingById).mockResolvedValue(makeListing() as any);
    vi.mocked(listingRepo.atomicBuyListing).mockRejectedValue(new Error("Insufficient balance"));

    await expect(buyListing("buyer-1", "listing-1")).rejects.toThrow("Insufficient balance");
  });
});

describe("expireListings", () => {
  it("returns count of expired listings", async () => {
    vi.mocked(listingRepo.expireListings).mockResolvedValue({ count: 3 });
    const count = await expireListings();
    expect(count).toBe(3);
    expect(listingRepo.expireListings).toHaveBeenCalled();
  });

  it("returns 0 when no listings to expire", async () => {
    vi.mocked(listingRepo.expireListings).mockResolvedValue({ count: 0 });
    const count = await expireListings();
    expect(count).toBe(0);
  });
});
