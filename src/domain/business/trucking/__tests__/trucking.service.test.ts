import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../trucking.repository");
vi.mock("../../business.repository");
vi.mock("@/lib/prisma", () => ({
  prisma: {
    farm: { findUnique: vi.fn() },
    business: { findMany: vi.fn() },
  },
}));

import * as truckRepo from "../trucking.repository";
import * as bizRepo from "../../business.repository";
import { prisma } from "@/lib/prisma";
import { postDeliveryRequest, getDeliveries, acceptDelivery, markDelivered, confirmDelivery, cancelDelivery } from "../trucking.service";

const mockBusiness = {
  id: "biz-1",
  ownerId: "owner-1",
  ownerName: "TruckerOwner",
  gameServerId: "srv-1",
  serverName: "TestServer",
  type: "trucking",
  name: "Fast Haulers",
  description: "",
  status: "active",
  settings: {},
  createdAt: new Date().toISOString(),
};

const mockContract = {
  id: "del-1",
  businessId: "biz-1",
  business: { name: "Fast Haulers" },
  posterId: "poster-1",
  poster: { displayName: "Poster" },
  gameServerId: "srv-1",
  destinationFarm: { name: "My Farm", farmSlot: 2, gameServer: { name: "TestServer" } },
  itemDescription: "100 bags of wheat",
  payout: 5000n,
  status: "open",
  acceptedAt: null,
  deliveredAt: null,
  completedAt: null,
  createdAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("trucking.service", () => {
  describe("postDeliveryRequest", () => {
    it("creates a delivery request with escrow", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(prisma.farm.findUnique).mockResolvedValue({
        id: "farm-1",
        gameServerId: "srv-1",
      } as Awaited<ReturnType<typeof prisma.farm.findUnique>>);
      vi.mocked(truckRepo.createDelivery).mockResolvedValue(mockContract);

      const result = await postDeliveryRequest("poster-1", "biz-1", {
        destinationFarmId: "farm-1",
        itemDescription: "100 bags of wheat",
        payout: "5000",
      });

      expect(result.itemDescription).toBe("100 bags of wheat");
      expect(result.payout).toBe("5000");
    });

    it("rejects non-trucking business", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue({
        ...mockBusiness,
        type: "bank",
      } as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);

      await expect(
        postDeliveryRequest("poster-1", "biz-1", {
          destinationFarmId: "farm-1",
          itemDescription: "test",
          payout: "1000",
        })
      ).rejects.toThrow("Not a trucking company");
    });
  });

  describe("getDeliveries", () => {
    it("returns all for owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(truckRepo.findDeliveriesByBusiness).mockResolvedValue([mockContract]);

      const result = await getDeliveries("owner-1", "biz-1");
      expect(result).toHaveLength(1);
    });

    it("returns poster's contracts for non-owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(truckRepo.findDeliveriesByPoster).mockResolvedValue([mockContract]);

      const result = await getDeliveries("poster-1", "biz-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("acceptDelivery", () => {
    it("owner accepts open delivery", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(truckRepo.findDeliveryById).mockResolvedValue(mockContract);
      vi.mocked(truckRepo.acceptDelivery).mockResolvedValue({ ...mockContract, status: "accepted" });

      const result = await acceptDelivery("owner-1", "biz-1", "del-1");
      expect(result.status).toBe("accepted");
    });

    it("rejects non-owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);

      await expect(acceptDelivery("other", "biz-1", "del-1")).rejects.toThrow("Not the trucking company owner");
    });
  });

  describe("markDelivered", () => {
    it("owner marks accepted delivery as delivered", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(truckRepo.findDeliveryById).mockResolvedValue({ ...mockContract, status: "accepted" });
      vi.mocked(truckRepo.markDelivered).mockResolvedValue({ ...mockContract, status: "delivered" });

      const result = await markDelivered("owner-1", "biz-1", "del-1");
      expect(result.status).toBe("delivered");
    });
  });

  describe("confirmDelivery", () => {
    it("poster confirms delivered contract", async () => {
      vi.mocked(truckRepo.findDeliveryById).mockResolvedValue({ ...mockContract, status: "delivered" });
      vi.mocked(truckRepo.confirmDelivery).mockResolvedValue({ ...mockContract, status: "completed" });

      const result = await confirmDelivery("poster-1", "biz-1", "del-1");
      expect(result.status).toBe("completed");
    });

    it("rejects non-poster", async () => {
      vi.mocked(truckRepo.findDeliveryById).mockResolvedValue({ ...mockContract, status: "delivered" });

      await expect(confirmDelivery("other", "biz-1", "del-1")).rejects.toThrow("Not the poster");
    });
  });

  describe("cancelDelivery", () => {
    it("poster cancels open delivery (refund)", async () => {
      vi.mocked(truckRepo.findDeliveryById).mockResolvedValue(mockContract);
      vi.mocked(truckRepo.cancelDelivery).mockResolvedValue({ ...mockContract, status: "cancelled" });

      const result = await cancelDelivery("poster-1", "biz-1", "del-1");
      expect(result.status).toBe("cancelled");
    });

    it("rejects poster cancel on accepted delivery", async () => {
      vi.mocked(truckRepo.findDeliveryById).mockResolvedValue({ ...mockContract, status: "accepted" });
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);

      await expect(cancelDelivery("poster-1", "biz-1", "del-1")).rejects.toThrow("Cannot cancel");
    });
  });
});
