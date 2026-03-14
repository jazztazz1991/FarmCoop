import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createBusiness,
  getMyBusinesses,
  getBusiness,
  browseBusinesses,
  updateBusinessSettings,
  closeBusiness,
  getBusinessWallet,
  getBusinessLedger,
  depositToBusinessWallet,
  withdrawFromBusinessWallet,
} from "../business.service";

vi.mock("../business.repository", () => ({
  createBusiness: vi.fn(),
  findBusinessById: vi.fn(),
  findBusinessesByOwner: vi.fn(),
  findBusinesses: vi.fn(),
  updateBusiness: vi.fn(),
  findExistingBusiness: vi.fn(),
  getBusinessWallet: vi.fn(),
  getBusinessLedger: vi.fn(),
  depositToBusinessWallet: vi.fn(),
  withdrawFromBusinessWallet: vi.fn(),
}));

import * as repo from "../business.repository";

const mockRepo = repo as unknown as {
  createBusiness: ReturnType<typeof vi.fn>;
  findBusinessById: ReturnType<typeof vi.fn>;
  findBusinessesByOwner: ReturnType<typeof vi.fn>;
  findBusinesses: ReturnType<typeof vi.fn>;
  updateBusiness: ReturnType<typeof vi.fn>;
  findExistingBusiness: ReturnType<typeof vi.fn>;
  getBusinessWallet: ReturnType<typeof vi.fn>;
  getBusinessLedger: ReturnType<typeof vi.fn>;
  depositToBusinessWallet: ReturnType<typeof vi.fn>;
  withdrawFromBusinessWallet: ReturnType<typeof vi.fn>;
};

const mockBusiness = {
  id: "biz-1",
  ownerId: "user-1",
  gameServerId: "server-1",
  type: "bank",
  name: "Jazz's Bank",
  description: "A player-run bank",
  status: "active",
  settings: {},
  createdAt: new Date("2026-01-01"),
  owner: { displayName: "Jazz" },
  gameServer: { name: "Test Server" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createBusiness", () => {
  it("creates a business when career matches type", async () => {
    mockRepo.findExistingBusiness.mockResolvedValue(null);
    mockRepo.createBusiness.mockResolvedValue(mockBusiness);

    const result = await createBusiness("user-1", "banker", {
      gameServerId: "server-1",
      type: "bank",
      name: "Jazz's Bank",
      description: "A player-run bank",
    });

    expect(result.id).toBe("biz-1");
    expect(result.type).toBe("bank");
    expect(result.ownerName).toBe("Jazz");
    expect(result.serverName).toBe("Test Server");
    expect(mockRepo.createBusiness).toHaveBeenCalledOnce();
  });

  it("throws ForbiddenError when career does not match", async () => {
    await expect(
      createBusiness("user-1", "farmer", {
        gameServerId: "server-1",
        type: "bank",
        name: "Nope",
      })
    ).rejects.toThrow('Career "farmer" cannot create a bank business');
  });

  it("throws ConflictError when business already exists", async () => {
    mockRepo.findExistingBusiness.mockResolvedValue({ id: "existing" });

    await expect(
      createBusiness("user-1", "banker", {
        gameServerId: "server-1",
        type: "bank",
        name: "Another Bank",
      })
    ).rejects.toThrow("You already have a bank business on this server");
  });
});

describe("getMyBusinesses", () => {
  it("returns businesses owned by user", async () => {
    mockRepo.findBusinessesByOwner.mockResolvedValue([mockBusiness]);

    const result = await getMyBusinesses("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Jazz's Bank");
  });
});

describe("getBusiness", () => {
  it("returns business by id", async () => {
    mockRepo.findBusinessById.mockResolvedValue(mockBusiness);

    const result = await getBusiness("biz-1");
    expect(result.id).toBe("biz-1");
  });

  it("throws NotFoundError for missing business", async () => {
    mockRepo.findBusinessById.mockResolvedValue(null);

    await expect(getBusiness("nonexistent")).rejects.toThrow(
      "Business not found"
    );
  });
});

describe("browseBusinesses", () => {
  it("returns businesses filtered by type", async () => {
    mockRepo.findBusinesses.mockResolvedValue([mockBusiness]);

    const result = await browseBusinesses({ type: "bank" });
    expect(result).toHaveLength(1);
    expect(mockRepo.findBusinesses).toHaveBeenCalledWith({ type: "bank" });
  });
});

describe("updateBusinessSettings", () => {
  it("updates settings for business owner", async () => {
    mockRepo.findBusinessById.mockResolvedValue(mockBusiness);
    mockRepo.updateBusiness.mockResolvedValue({
      ...mockBusiness,
      name: "Updated Bank",
    });

    const result = await updateBusinessSettings("user-1", "biz-1", {
      name: "Updated Bank",
    });
    expect(result.name).toBe("Updated Bank");
  });

  it("throws ForbiddenError for non-owner", async () => {
    mockRepo.findBusinessById.mockResolvedValue(mockBusiness);

    await expect(
      updateBusinessSettings("other-user", "biz-1", { name: "Hack" })
    ).rejects.toThrow("Not the business owner");
  });
});

describe("closeBusiness", () => {
  it("closes business for owner", async () => {
    mockRepo.findBusinessById.mockResolvedValue(mockBusiness);
    mockRepo.updateBusiness.mockResolvedValue({
      ...mockBusiness,
      status: "closed",
    });

    const result = await closeBusiness("user-1", "biz-1");
    expect(result.status).toBe("closed");
  });
});

describe("getBusinessWallet", () => {
  it("returns wallet balance as string", async () => {
    mockRepo.getBusinessWallet.mockResolvedValue({ balance: 10000n });

    const result = await getBusinessWallet("biz-1");
    expect(result.balance).toBe("10000");
  });

  it("throws NotFoundError when no wallet", async () => {
    mockRepo.getBusinessWallet.mockResolvedValue(null);

    await expect(getBusinessWallet("biz-1")).rejects.toThrow(
      "Business wallet not found"
    );
  });
});

describe("getBusinessLedger", () => {
  it("returns ledger entries with string amounts", async () => {
    mockRepo.getBusinessLedger.mockResolvedValue([
      {
        id: "entry-1",
        amount: 5000n,
        type: "owner_deposit",
        description: "Deposit",
        createdAt: new Date(),
      },
    ]);

    const result = await getBusinessLedger("biz-1");
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe("5000");
  });
});

describe("depositToBusinessWallet", () => {
  it("calls repo deposit for owner", async () => {
    mockRepo.findBusinessById.mockResolvedValue(mockBusiness);
    mockRepo.depositToBusinessWallet.mockResolvedValue(undefined);

    await depositToBusinessWallet("user-1", "biz-1", "5000");
    expect(mockRepo.depositToBusinessWallet).toHaveBeenCalledWith(
      "biz-1",
      "user-1",
      5000n
    );
  });

  it("throws for non-owner", async () => {
    mockRepo.findBusinessById.mockResolvedValue(mockBusiness);

    await expect(
      depositToBusinessWallet("other-user", "biz-1", "5000")
    ).rejects.toThrow("Not the business owner");
  });

  it("rejects invalid amount", async () => {
    await expect(
      depositToBusinessWallet("user-1", "biz-1", "-100")
    ).rejects.toThrow();
  });
});

describe("withdrawFromBusinessWallet", () => {
  it("calls repo withdraw for owner", async () => {
    mockRepo.findBusinessById.mockResolvedValue(mockBusiness);
    mockRepo.withdrawFromBusinessWallet.mockResolvedValue(undefined);

    await withdrawFromBusinessWallet("user-1", "biz-1", "3000");
    expect(mockRepo.withdrawFromBusinessWallet).toHaveBeenCalledWith(
      "biz-1",
      "user-1",
      3000n
    );
  });
});
