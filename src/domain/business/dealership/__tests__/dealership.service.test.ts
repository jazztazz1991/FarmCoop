import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../dealership.repository");
vi.mock("../../business.repository");
vi.mock("@/lib/prisma", () => ({
  prisma: {
    farm: { findUnique: vi.fn() },
    business: { findMany: vi.fn() },
  },
}));

import * as dealerRepo from "../dealership.repository";
import * as bizRepo from "../../business.repository";
import { prisma } from "@/lib/prisma";
import { addItem, getInventory, updateItemPrice, removeItem, purchaseItem } from "../dealership.service";

const mockBusiness = {
  id: "biz-1",
  ownerId: "owner-1",
  ownerName: "DealerOwner",
  gameServerId: "srv-1",
  serverName: "TestServer",
  type: "dealership",
  name: "Test Dealership",
  description: "",
  status: "active",
  settings: {},
  createdAt: new Date().toISOString(),
};

const mockListing = {
  id: "item-1",
  businessId: "biz-1",
  business: { name: "Test Dealership" },
  itemId: "data/vehicles/fendt/vario900.xml",
  itemName: "Fendt Vario 900",
  category: "equipment",
  quantity: 1,
  pricePerUnit: 350000n,
  status: "active",
  buyerId: null,
  recipientFarmId: null,
  createdAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("dealership.service", () => {
  describe("addItem", () => {
    it("adds an item to inventory", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(dealerRepo.addItem).mockResolvedValue(mockListing);

      const result = await addItem("owner-1", "biz-1", {
        itemId: "data/vehicles/fendt/vario900.xml",
        itemName: "Fendt Vario 900",
        category: "equipment",
        quantity: 1,
        pricePerUnit: "350000",
      });

      expect(result.itemName).toBe("Fendt Vario 900");
      expect(result.pricePerUnit).toBe("350000");
    });

    it("rejects non-owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);

      await expect(
        addItem("other-user", "biz-1", {
          itemId: "test",
          itemName: "Test",
          category: "equipment",
          quantity: 1,
          pricePerUnit: "1000",
        })
      ).rejects.toThrow("Not the dealership owner");
    });

    it("rejects non-dealership business", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue({
        ...mockBusiness,
        type: "bank",
      } as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);

      await expect(
        addItem("owner-1", "biz-1", {
          itemId: "test",
          itemName: "Test",
          category: "equipment",
          quantity: 1,
          pricePerUnit: "1000",
        })
      ).rejects.toThrow("Not a dealership");
    });
  });

  describe("getInventory", () => {
    it("returns active inventory", async () => {
      vi.mocked(dealerRepo.findInventory).mockResolvedValue([mockListing]);

      const result = await getInventory("biz-1");
      expect(result).toHaveLength(1);
      expect(result[0].itemName).toBe("Fendt Vario 900");
    });
  });

  describe("updateItemPrice", () => {
    it("updates price for owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(dealerRepo.findListingById).mockResolvedValue(mockListing);
      vi.mocked(dealerRepo.updatePrice).mockResolvedValue({ ...mockListing, pricePerUnit: 400000n });

      const result = await updateItemPrice("owner-1", "biz-1", "item-1", { pricePerUnit: "400000" });
      expect(result.pricePerUnit).toBe("400000");
    });
  });

  describe("removeItem", () => {
    it("removes item for owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(dealerRepo.findListingById).mockResolvedValue(mockListing);
      vi.mocked(dealerRepo.removeItem).mockResolvedValue({ ...mockListing, status: "cancelled" });

      const result = await removeItem("owner-1", "biz-1", "item-1");
      expect(result.status).toBe("cancelled");
    });
  });

  describe("purchaseItem", () => {
    it("purchases item with farm delivery", async () => {
      vi.mocked(dealerRepo.findListingById).mockResolvedValue(mockListing);
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(prisma.farm.findUnique).mockResolvedValue({
        id: "farm-1",
        farmSlot: 2,
        gameServerId: "srv-1",
      } as Awaited<ReturnType<typeof prisma.farm.findUnique>>);
      vi.mocked(dealerRepo.purchaseItem).mockResolvedValue({ ...mockListing, status: "sold" });

      const result = await purchaseItem("buyer-1", "biz-1", "item-1", {
        recipientFarmId: "farm-1",
      });

      expect(result.status).toBe("sold");
      expect(dealerRepo.purchaseItem).toHaveBeenCalledWith(
        "item-1", "biz-1", "buyer-1", "farm-1", "srv-1", 350000n, "data/vehicles/fendt/vario900.xml", 2
      );
    });

    it("rejects purchase of sold item", async () => {
      vi.mocked(dealerRepo.findListingById).mockResolvedValue({ ...mockListing, status: "sold" });

      await expect(
        purchaseItem("buyer-1", "biz-1", "item-1", { recipientFarmId: "farm-1" })
      ).rejects.toThrow("no longer available");
    });
  });
});
