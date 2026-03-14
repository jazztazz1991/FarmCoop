import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../insurance-co.repository");
vi.mock("../../business.repository");

import * as insuranceRepo from "../insurance-co.repository";
import * as bizRepo from "../../business.repository";
import { purchasePolicy, getPolicies, fileClaim, getClaimsForReview, reviewClaim } from "../insurance-co.service";

const mockBusiness = {
  id: "biz-1",
  ownerId: "owner-1",
  ownerName: "InsurerOwner",
  gameServerId: "srv-1",
  serverName: "TestServer",
  type: "insurance",
  name: "Test Insurance Co",
  description: "",
  status: "active",
  settings: {},
  createdAt: new Date().toISOString(),
};

const mockPolicy = {
  id: "pol-1",
  businessId: "biz-1",
  business: { name: "Test Insurance Co" },
  holderId: "user-1",
  holder: { displayName: "PolicyHolder" },
  type: "crop",
  coverageAmount: 100000n,
  premium: 2466n,
  deductible: 10000n,
  status: "active",
  commodityId: "WHEAT",
  commodityName: "Wheat",
  equipmentId: null,
  equipmentName: null,
  startsAt: new Date(),
  expiresAt: new Date(),
  createdAt: new Date(),
};

const mockClaim = {
  id: "claim-1",
  businessId: "biz-1",
  policyId: "pol-1",
  claimAmount: 50000n,
  payout: 0n,
  reason: "Crop failed",
  status: "pending",
  resolvedAt: null,
  createdAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("insurance-co.service", () => {
  describe("purchasePolicy", () => {
    it("creates a policy and charges premium", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(insuranceRepo.createPolicy).mockResolvedValue(mockPolicy);

      const result = await purchasePolicy("user-1", "biz-1", {
        type: "crop",
        coverageAmount: "100000",
        termDays: 30,
        commodityId: "WHEAT",
        commodityName: "Wheat",
      });

      expect(result.type).toBe("crop");
      expect(result.coverageAmount).toBe("100000");
    });

    it("rejects non-insurance business", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue({
        ...mockBusiness,
        type: "bank",
      } as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);

      await expect(
        purchasePolicy("user-1", "biz-1", {
          type: "crop",
          coverageAmount: "100000",
          termDays: 30,
        })
      ).rejects.toThrow("Not an insurance company");
    });
  });

  describe("getPolicies", () => {
    it("returns all policies for owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(insuranceRepo.findPoliciesByBusiness).mockResolvedValue([mockPolicy]);

      const result = await getPolicies("owner-1", "biz-1");
      expect(result).toHaveLength(1);
    });

    it("returns holder's policies for non-owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(insuranceRepo.findPoliciesByHolder).mockResolvedValue([mockPolicy]);

      const result = await getPolicies("user-1", "biz-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("fileClaim", () => {
    it("files a claim for active policy", async () => {
      vi.mocked(insuranceRepo.findPolicyById).mockResolvedValue({
        ...mockPolicy,
        claims: [],
      });
      vi.mocked(insuranceRepo.createClaim).mockResolvedValue(mockClaim);

      const result = await fileClaim("user-1", "biz-1", "pol-1", {
        claimAmount: "50000",
        reason: "Crop failed",
      });

      expect(result.reason).toBe("Crop failed");
      expect(result.status).toBe("pending");
    });

    it("rejects non-holder", async () => {
      vi.mocked(insuranceRepo.findPolicyById).mockResolvedValue({
        ...mockPolicy,
        claims: [],
      });

      await expect(
        fileClaim("other-user", "biz-1", "pol-1", { claimAmount: "50000", reason: "test" })
      ).rejects.toThrow("Not the policy holder");
    });
  });

  describe("getClaimsForReview", () => {
    it("returns pending claims for owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(insuranceRepo.findClaimsByBusiness).mockResolvedValue([mockClaim]);

      const result = await getClaimsForReview("owner-1", "biz-1");
      expect(result).toHaveLength(1);
    });

    it("rejects non-owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);

      await expect(getClaimsForReview("other-user", "biz-1")).rejects.toThrow("Not the company owner");
    });
  });

  describe("reviewClaim", () => {
    it("denies claim", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(insuranceRepo.findClaimById).mockResolvedValue({
        ...mockClaim,
        policy: { holderId: "user-1", coverageAmount: 100000n, deductible: 10000n },
      });
      vi.mocked(insuranceRepo.denyClaim).mockResolvedValue({ ...mockClaim, status: "denied", resolvedAt: new Date() });

      const result = await reviewClaim("owner-1", "biz-1", "claim-1", { decision: "deny" });
      expect(result.status).toBe("denied");
    });

    it("approves claim with payout", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(insuranceRepo.findClaimById).mockResolvedValue({
        ...mockClaim,
        policy: { holderId: "user-1", coverageAmount: 100000n, deductible: 10000n },
      });
      vi.mocked(insuranceRepo.approveClaim).mockResolvedValue({
        ...mockClaim,
        status: "approved",
        payout: 40000n,
        resolvedAt: new Date(),
      });

      const result = await reviewClaim("owner-1", "biz-1", "claim-1", { decision: "approve" });
      expect(result.status).toBe("approved");
    });
  });
});
