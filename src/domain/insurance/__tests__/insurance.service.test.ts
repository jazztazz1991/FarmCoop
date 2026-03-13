import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  purchasePolicy,
  fileClaim,
  getMyPolicies,
  getMyClaims,
  getPremiumQuote,
  expirePolicies,
  toPolicyDTO,
  toClaimDTO,
} from "../insurance.service";

vi.mock("../insurance.repository", () => ({
  purchasePolicy: vi.fn(),
  approveClaim: vi.fn(),
  denyClaim: vi.fn(),
  findPoliciesByHolder: vi.fn(),
  findPolicyById: vi.fn(),
  findClaimsByHolder: vi.fn(),
  findExpiredPolicies: vi.fn(),
  expirePolicy: vi.fn(),
}));

vi.mock("../../notification/notification.service", () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../pricing/pricing.service", () => ({
  getPrice: vi.fn(),
}));

import * as insuranceRepo from "../insurance.repository";
import * as pricingService from "../../pricing/pricing.service";

const mockRepo = insuranceRepo as unknown as {
  purchasePolicy: ReturnType<typeof vi.fn>;
  approveClaim: ReturnType<typeof vi.fn>;
  denyClaim: ReturnType<typeof vi.fn>;
  findPoliciesByHolder: ReturnType<typeof vi.fn>;
  findPolicyById: ReturnType<typeof vi.fn>;
  findClaimsByHolder: ReturnType<typeof vi.fn>;
  findExpiredPolicies: ReturnType<typeof vi.fn>;
  expirePolicy: ReturnType<typeof vi.fn>;
};

const mockPricing = pricingService as unknown as {
  getPrice: ReturnType<typeof vi.fn>;
};

function makeMockPolicy(overrides = {}) {
  return {
    id: "policy-1",
    holderId: "user-1",
    gameServerId: "server-1",
    type: "vehicle",
    coverageAmount: 100000n,
    premium: 5000n,
    deductible: 1000n,
    status: "active",
    commodityId: null,
    commodityName: null,
    strikePrice: null,
    equipmentId: "eq-1",
    equipmentName: "Tractor",
    startsAt: new Date("2026-03-12"),
    expiresAt: new Date("2026-06-12"),
    createdAt: new Date("2026-03-12"),
    ...overrides,
  };
}

function makeMockCropPolicy(overrides = {}) {
  return makeMockPolicy({
    type: "crop",
    commodityId: "WHEAT",
    commodityName: "Wheat",
    strikePrice: 1000n,
    equipmentId: null,
    equipmentName: null,
    ...overrides,
  });
}

function makeMockClaim(overrides = {}) {
  return {
    id: "claim-1",
    policyId: "policy-1",
    claimAmount: 10000n,
    payout: 9000n,
    reason: "Damage",
    status: "approved",
    resolvedAt: new Date("2026-03-12"),
    createdAt: new Date("2026-03-12"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── DTO Mappers ──────────────────────────────────────────

describe("toPolicyDTO", () => {
  it("serializes BigInt and Date fields", () => {
    const dto = toPolicyDTO(makeMockPolicy());
    expect(dto.coverageAmount).toBe("100000");
    expect(dto.premium).toBe("5000");
    expect(dto.deductible).toBe("1000");
    expect(dto.strikePrice).toBeNull();
    expect(dto.expiresAt).toBe("2026-06-12T00:00:00.000Z");
  });
});

describe("toClaimDTO", () => {
  it("serializes BigInt and Date fields", () => {
    const dto = toClaimDTO(makeMockClaim());
    expect(dto.claimAmount).toBe("10000");
    expect(dto.payout).toBe("9000");
    expect(dto.status).toBe("approved");
  });
});

// ── Purchase ─────────────────────────────────────────────

describe("purchasePolicy", () => {
  it("validates and purchases a vehicle policy", async () => {
    mockRepo.purchasePolicy.mockResolvedValue(makeMockPolicy());

    const result = await purchasePolicy("user-1", {
      gameServerId: "server-1",
      type: "vehicle",
      coverageAmount: "100000",
      termDays: 90,
      equipmentId: "eq-1",
      equipmentName: "Tractor",
    });

    expect(mockRepo.purchasePolicy).toHaveBeenCalledOnce();
    expect(result.id).toBe("policy-1");
  });

  it("rejects crop policy without commodity data", async () => {
    await expect(
      purchasePolicy("user-1", {
        gameServerId: "server-1",
        type: "crop",
        coverageAmount: "100000",
        termDays: 90,
      })
    ).rejects.toThrow();
  });

  it("rejects invalid coverage amount", async () => {
    await expect(
      purchasePolicy("user-1", {
        gameServerId: "server-1",
        type: "vehicle",
        coverageAmount: "-100",
        termDays: 90,
      })
    ).rejects.toThrow();
  });
});

// ── Claims ───────────────────────────────────────────────

describe("fileClaim", () => {
  it("approves a vehicle claim with payout", async () => {
    mockRepo.findPolicyById.mockResolvedValue(makeMockPolicy());
    mockRepo.approveClaim.mockResolvedValue(makeMockClaim());

    const result = await fileClaim("user-1", {
      policyId: "policy-1",
      claimAmount: "10000",
      reason: "Damage",
    });

    expect(mockRepo.approveClaim).toHaveBeenCalledOnce();
    expect(result.status).toBe("approved");
  });

  it("denies claim when deductible exceeds loss", async () => {
    mockRepo.findPolicyById.mockResolvedValue(
      makeMockPolicy({ deductible: 50000n })
    );
    mockRepo.denyClaim.mockResolvedValue(
      makeMockClaim({ status: "denied", payout: 0n })
    );

    const result = await fileClaim("user-1", {
      policyId: "policy-1",
      claimAmount: "1000",
      reason: "Minor scratch",
    });

    expect(mockRepo.denyClaim).toHaveBeenCalledOnce();
    expect(result.status).toBe("denied");
  });

  it("evaluates crop claim using current price", async () => {
    mockRepo.findPolicyById.mockResolvedValue(makeMockCropPolicy());
    mockPricing.getPrice.mockResolvedValue({
      currentPrice: "800",
    });
    mockRepo.approveClaim.mockResolvedValue(makeMockClaim({ payout: 1000n }));

    // Claim amount = quantity for crop = 10 units
    // Loss = (1000 - 800) * 10 - 1000 deductible = 1000
    await fileClaim("user-1", {
      policyId: "policy-1",
      claimAmount: "10",
      reason: "Price drop",
    });

    expect(mockPricing.getPrice).toHaveBeenCalledWith("server-1", "WHEAT");
    expect(mockRepo.approveClaim).toHaveBeenCalledOnce();
  });

  it("denies crop claim when price above strike", async () => {
    mockRepo.findPolicyById.mockResolvedValue(makeMockCropPolicy());
    mockPricing.getPrice.mockResolvedValue({ currentPrice: "1200" });
    mockRepo.denyClaim.mockResolvedValue(
      makeMockClaim({ status: "denied", payout: 0n })
    );

    const result = await fileClaim("user-1", {
      policyId: "policy-1",
      claimAmount: "10",
      reason: "Price drop",
    });

    expect(result.status).toBe("denied");
  });

  it("rejects if policy not found", async () => {
    mockRepo.findPolicyById.mockResolvedValue(null);
    await expect(
      fileClaim("user-1", { policyId: "bad", claimAmount: "1000", reason: "test" })
    ).rejects.toThrow("Policy not found");
  });

  it("rejects if not the holder", async () => {
    mockRepo.findPolicyById.mockResolvedValue(makeMockPolicy());
    await expect(
      fileClaim("other-user", { policyId: "policy-1", claimAmount: "1000", reason: "test" })
    ).rejects.toThrow("Not your policy");
  });

  it("rejects if policy not active", async () => {
    mockRepo.findPolicyById.mockResolvedValue(makeMockPolicy({ status: "expired" }));
    await expect(
      fileClaim("user-1", { policyId: "policy-1", claimAmount: "1000", reason: "test" })
    ).rejects.toThrow("Policy is not active");
  });
});

// ── Queries ──────────────────────────────────────────────

describe("getMyPolicies", () => {
  it("returns policy DTOs", async () => {
    mockRepo.findPoliciesByHolder.mockResolvedValue([makeMockPolicy()]);
    const result = await getMyPolicies("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("policy-1");
  });
});

describe("getMyClaims", () => {
  it("returns claim DTOs", async () => {
    mockRepo.findClaimsByHolder.mockResolvedValue([makeMockClaim()]);
    const result = await getMyClaims("user-1");
    expect(result).toHaveLength(1);
  });
});

describe("getPremiumQuote", () => {
  it("returns premium as string", () => {
    // 100,000 vehicle at 5% for 365 = 5,000
    const quote = getPremiumQuote("vehicle", "100000", 365);
    expect(quote).toBe("5000");
  });
});

describe("expirePolicies", () => {
  it("expires and counts policies", async () => {
    mockRepo.findExpiredPolicies.mockResolvedValue([makeMockPolicy()]);
    mockRepo.expirePolicy.mockResolvedValue(makeMockPolicy({ status: "expired" }));

    const count = await expirePolicies();
    expect(count).toBe(1);
    expect(mockRepo.expirePolicy).toHaveBeenCalledWith("policy-1");
  });
});
