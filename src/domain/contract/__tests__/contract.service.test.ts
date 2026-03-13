import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createContract,
  getOpenContracts,
  getContract,
  getMyPostedContracts,
  getMyClaimedContracts,
  claimContract,
  deliverContract,
  completeContract,
  cancelContract,
  expireContracts,
  toDTO,
} from "../contract.service";

vi.mock("../contract.repository", () => ({
  createContractWithEscrow: vi.fn(),
  findOpenContracts: vi.fn(),
  findContractById: vi.fn(),
  findContractsByPoster: vi.fn(),
  findContractsByClaimer: vi.fn(),
  claimContract: vi.fn(),
  markDelivered: vi.fn(),
  completeContractWithPayout: vi.fn(),
  cancelContractWithRefund: vi.fn(),
  expireContracts: vi.fn(),
}));

vi.mock("../../notification/notification.service", () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../pricing/pricing.service", () => ({
  recalculate: vi.fn().mockResolvedValue(null),
}));

import * as contractRepo from "../contract.repository";

const mockRepo = contractRepo as unknown as {
  createContractWithEscrow: ReturnType<typeof vi.fn>;
  findOpenContracts: ReturnType<typeof vi.fn>;
  findContractById: ReturnType<typeof vi.fn>;
  findContractsByPoster: ReturnType<typeof vi.fn>;
  findContractsByClaimer: ReturnType<typeof vi.fn>;
  claimContract: ReturnType<typeof vi.fn>;
  markDelivered: ReturnType<typeof vi.fn>;
  completeContractWithPayout: ReturnType<typeof vi.fn>;
  cancelContractWithRefund: ReturnType<typeof vi.fn>;
  expireContracts: ReturnType<typeof vi.fn>;
};

const SERVER = "server-1";
const POSTER = "user-poster";
const CLAIMER = "user-claimer";

function makeRepoContract(overrides = {}) {
  return {
    id: "contract-1",
    gameServerId: SERVER,
    posterId: POSTER,
    poster: { displayName: "Poster" },
    claimerId: null,
    claimer: null,
    commodityId: "wheat",
    commodityName: "Wheat",
    quantity: 10,
    pricePerUnit: 100n,
    totalPayout: 1000n,
    status: "open",
    expiresAt: new Date("2026-12-31T00:00:00Z"),
    deliveryDeadline: null,
    claimedAt: null,
    deliveredAt: null,
    completedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("toDTO", () => {
  it("converts repo contract to DTO with string BigInts and ISO dates", () => {
    const dto = toDTO(makeRepoContract());
    expect(dto).toEqual({
      id: "contract-1",
      gameServerId: SERVER,
      posterId: POSTER,
      posterName: "Poster",
      claimerId: null,
      claimerName: null,
      commodityId: "wheat",
      commodityName: "Wheat",
      quantity: 10,
      pricePerUnit: "100",
      totalPayout: "1000",
      status: "open",
      expiresAt: "2026-12-31T00:00:00.000Z",
      deliveryDeadline: null,
      claimedAt: null,
      deliveredAt: null,
      completedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("includes claimer info when present", () => {
    const dto = toDTO(
      makeRepoContract({
        claimerId: CLAIMER,
        claimer: { displayName: "Claimer" },
      })
    );
    expect(dto.claimerId).toBe(CLAIMER);
    expect(dto.claimerName).toBe("Claimer");
  });
});

describe("createContract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates input, calculates total, and creates with escrow", async () => {
    mockRepo.createContractWithEscrow.mockResolvedValue(makeRepoContract());

    const result = await createContract(POSTER, {
      gameServerId: SERVER,
      commodityId: "wheat",
      commodityName: "Wheat",
      quantity: 10,
      pricePerUnit: 100,
      expiresAt: "2026-12-31T00:00:00Z",
    });

    expect(mockRepo.createContractWithEscrow).toHaveBeenCalledWith({
      gameServerId: SERVER,
      posterId: POSTER,
      commodityId: "wheat",
      commodityName: "Wheat",
      quantity: 10,
      pricePerUnit: 100n,
      totalPayout: 1000n,
      expiresAt: new Date("2026-12-31T00:00:00Z"),
    });
    expect(result.totalPayout).toBe("1000");
  });

  it("rejects invalid input (negative quantity)", async () => {
    await expect(
      createContract(POSTER, {
        gameServerId: SERVER,
        commodityId: "wheat",
        commodityName: "Wheat",
        quantity: -5,
        pricePerUnit: 100,
        expiresAt: "2026-12-31T00:00:00Z",
      })
    ).rejects.toThrow();
  });

  it("rejects invalid date string", async () => {
    await expect(
      createContract(POSTER, {
        gameServerId: SERVER,
        commodityId: "wheat",
        commodityName: "Wheat",
        quantity: 10,
        pricePerUnit: 100,
        expiresAt: "not-a-date",
      })
    ).rejects.toThrow();
  });
});

describe("getOpenContracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns open contracts as DTOs", async () => {
    mockRepo.findOpenContracts.mockResolvedValue([makeRepoContract()]);
    const result = await getOpenContracts(SERVER);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("open");
  });

  it("returns empty array when none exist", async () => {
    mockRepo.findOpenContracts.mockResolvedValue([]);
    const result = await getOpenContracts(SERVER);
    expect(result).toEqual([]);
  });
});

describe("getContract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a single contract DTO", async () => {
    mockRepo.findContractById.mockResolvedValue(makeRepoContract());
    const result = await getContract("contract-1");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("contract-1");
  });

  it("returns null when not found", async () => {
    mockRepo.findContractById.mockResolvedValue(null);
    const result = await getContract("nonexistent");
    expect(result).toBeNull();
  });
});

describe("getMyPostedContracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns contracts posted by user", async () => {
    mockRepo.findContractsByPoster.mockResolvedValue([makeRepoContract()]);
    const result = await getMyPostedContracts(POSTER);
    expect(result).toHaveLength(1);
  });
});

describe("getMyClaimedContracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns contracts claimed by user", async () => {
    mockRepo.findContractsByClaimer.mockResolvedValue([
      makeRepoContract({ claimerId: CLAIMER, claimer: { displayName: "Claimer" } }),
    ]);
    const result = await getMyClaimedContracts(CLAIMER);
    expect(result).toHaveLength(1);
  });
});

describe("claimContract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("claims an open contract", async () => {
    const open = makeRepoContract();
    mockRepo.findContractById.mockResolvedValue(open);
    const claimed = makeRepoContract({
      claimerId: CLAIMER,
      claimer: { displayName: "Claimer" },
      status: "claimed",
    });
    mockRepo.claimContract.mockResolvedValue(claimed);

    const result = await claimContract("contract-1", CLAIMER);
    expect(result.status).toBe("claimed");
    expect(mockRepo.claimContract).toHaveBeenCalled();
  });

  it("rejects if contract not found", async () => {
    mockRepo.findContractById.mockResolvedValue(null);
    await expect(claimContract("x", CLAIMER)).rejects.toThrow("Contract not found");
  });

  it("rejects if contract is not open", async () => {
    mockRepo.findContractById.mockResolvedValue(makeRepoContract({ status: "claimed" }));
    await expect(claimContract("contract-1", CLAIMER)).rejects.toThrow("not open");
  });

  it("rejects if claimer is the poster", async () => {
    mockRepo.findContractById.mockResolvedValue(makeRepoContract());
    await expect(claimContract("contract-1", POSTER)).rejects.toThrow("own contract");
  });

  it("rejects if contract has expired", async () => {
    mockRepo.findContractById.mockResolvedValue(
      makeRepoContract({ expiresAt: new Date("2020-01-01") })
    );
    await expect(claimContract("contract-1", CLAIMER)).rejects.toThrow("expired");
  });
});

describe("deliverContract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks a claimed contract as delivered", async () => {
    mockRepo.findContractById.mockResolvedValue(
      makeRepoContract({ status: "claimed", claimerId: CLAIMER })
    );
    mockRepo.markDelivered.mockResolvedValue(
      makeRepoContract({ status: "delivered", claimerId: CLAIMER })
    );

    const result = await deliverContract("contract-1", CLAIMER);
    expect(result.status).toBe("delivered");
  });

  it("rejects if not claimed", async () => {
    mockRepo.findContractById.mockResolvedValue(makeRepoContract());
    await expect(deliverContract("contract-1", CLAIMER)).rejects.toThrow("not claimed");
  });

  it("rejects if caller is not the claimer", async () => {
    mockRepo.findContractById.mockResolvedValue(
      makeRepoContract({ status: "claimed", claimerId: CLAIMER })
    );
    await expect(deliverContract("contract-1", "other-user")).rejects.toThrow("Only the claimer");
  });
});

describe("completeContract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("completes a delivered contract and pays claimer", async () => {
    mockRepo.findContractById.mockResolvedValue(
      makeRepoContract({ status: "delivered", claimerId: CLAIMER, claimer: { displayName: "Claimer" } })
    );
    mockRepo.completeContractWithPayout.mockResolvedValue(
      makeRepoContract({ status: "completed", claimerId: CLAIMER, claimer: { displayName: "Claimer" } })
    );

    const result = await completeContract("contract-1", POSTER);
    expect(result.status).toBe("completed");
    expect(mockRepo.completeContractWithPayout).toHaveBeenCalledWith(
      "contract-1", CLAIMER, 1000n, "Wheat", 10
    );
  });

  it("rejects if not delivered", async () => {
    mockRepo.findContractById.mockResolvedValue(makeRepoContract({ status: "claimed" }));
    await expect(completeContract("contract-1", POSTER)).rejects.toThrow("not been delivered");
  });

  it("rejects if caller is not the poster", async () => {
    mockRepo.findContractById.mockResolvedValue(
      makeRepoContract({ status: "delivered", claimerId: CLAIMER })
    );
    await expect(completeContract("contract-1", "other")).rejects.toThrow("Only the poster");
  });
});

describe("cancelContract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cancels an open contract and refunds escrow", async () => {
    mockRepo.findContractById.mockResolvedValue(makeRepoContract());
    mockRepo.cancelContractWithRefund.mockResolvedValue(
      makeRepoContract({ status: "cancelled" })
    );

    const result = await cancelContract("contract-1", POSTER);
    expect(result.status).toBe("cancelled");
    expect(mockRepo.cancelContractWithRefund).toHaveBeenCalledWith(
      "contract-1", POSTER, 1000n, "Wheat", 10
    );
  });

  it("cancels a claimed contract and refunds escrow", async () => {
    mockRepo.findContractById.mockResolvedValue(
      makeRepoContract({ status: "claimed", claimerId: CLAIMER })
    );
    mockRepo.cancelContractWithRefund.mockResolvedValue(
      makeRepoContract({ status: "cancelled" })
    );

    const result = await cancelContract("contract-1", POSTER);
    expect(result.status).toBe("cancelled");
  });

  it("rejects if caller is not the poster", async () => {
    mockRepo.findContractById.mockResolvedValue(makeRepoContract());
    await expect(cancelContract("contract-1", "other")).rejects.toThrow("Only the poster");
  });

  it("rejects if contract is delivered or completed", async () => {
    mockRepo.findContractById.mockResolvedValue(makeRepoContract({ status: "delivered" }));
    await expect(cancelContract("contract-1", POSTER)).rejects.toThrow("cannot be cancelled");
  });
});

describe("expireContracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("expires and refunds all overdue open contracts", async () => {
    mockRepo.expireContracts.mockResolvedValue([
      { id: "c1", posterId: "p1", totalPayout: 500n, commodityName: "Wheat", quantity: 5 },
      { id: "c2", posterId: "p2", totalPayout: 1000n, commodityName: "Corn", quantity: 10 },
    ]);
    mockRepo.cancelContractWithRefund.mockResolvedValue({});

    const count = await expireContracts();
    expect(count).toBe(2);
    expect(mockRepo.cancelContractWithRefund).toHaveBeenCalledTimes(2);
  });

  it("returns 0 when no contracts are expired", async () => {
    mockRepo.expireContracts.mockResolvedValue([]);
    const count = await expireContracts();
    expect(count).toBe(0);
  });
});
