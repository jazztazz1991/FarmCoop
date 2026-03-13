import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBalance, deposit, withdraw, transfer, getLedger, creditDepositOnConfirmation } from "../wallet.service";

vi.mock("../wallet.repository", () => ({
  getBalance: vi.fn(),
  addLedgerEntry: vi.fn(),
  getLedgerEntries: vi.fn(),
}));

vi.mock("../../farm/farm.repository", () => ({
  findFarmById: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transaction: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../../notification/notification.service", () => ({
  notify: vi.fn().mockResolvedValue({}),
}));

import * as walletRepo from "../wallet.repository";
import * as farmRepo from "../../farm/farm.repository";
import { prisma } from "@/lib/prisma";

const mockFarm = {
  id: "farm-1",
  userId: "user-1",
  gameServerId: "server-1",
  farmSlot: 3,
  name: "Test Farm",
  createdAt: new Date(),
};

const mockLedgerEntry = {
  id: "entry-1",
  amount: 50000n,
  type: "deposit",
  description: "Deposit of $50000 from game",
  createdAt: new Date("2026-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getBalance", () => {
  it("returns balance as string", async () => {
    vi.mocked(walletRepo.getBalance).mockResolvedValue(100000n);

    const result = await getBalance("user-1");
    expect(result).toEqual({ balance: "100000" });
  });
});

describe("deposit", () => {
  it("creates a wallet_deposit transaction for the bridge", async () => {
    vi.mocked(farmRepo.findFarmById).mockResolvedValue(mockFarm);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      id: "tx-1",
      type: "wallet_deposit",
      amount: 50000,
      senderId: "user-1",
      recipientFarmId: "farm-1",
      gameServerId: "server-1",
      farmSlot: 3,
      status: "pending",
      equipmentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      bridgePickedUpAt: null,
      deliveredAt: null,
      confirmedAt: null,
    });

    const result = await deposit("user-1", { amount: 50000, farmId: "farm-1" });
    expect(result.transactionId).toBe("tx-1");
    expect(result.amount).toBe(50000);
    // Wallet should NOT be credited yet
    expect(walletRepo.addLedgerEntry).not.toHaveBeenCalled();
  });

  it("rejects if farm not found", async () => {
    vi.mocked(farmRepo.findFarmById).mockResolvedValue(null);
    await expect(deposit("user-1", { amount: 50000, farmId: "farm-x" })).rejects.toThrow("Farm not found");
  });

  it("rejects if farm belongs to another user", async () => {
    vi.mocked(farmRepo.findFarmById).mockResolvedValue({ ...mockFarm, userId: "other-user" });
    await expect(deposit("user-1", { amount: 50000, farmId: "farm-1" })).rejects.toThrow("Not your farm");
  });

  it("rejects zero amount", async () => {
    await expect(deposit("user-1", { amount: 0, farmId: "farm-1" })).rejects.toThrow();
  });
});

describe("creditDepositOnConfirmation", () => {
  it("credits wallet after bridge confirms deposit", async () => {
    vi.mocked(walletRepo.addLedgerEntry).mockResolvedValue(mockLedgerEntry);

    await creditDepositOnConfirmation("user-1", "tx-1", 50000);
    expect(walletRepo.addLedgerEntry).toHaveBeenCalledWith(
      "user-1",
      50000n,
      "deposit",
      "Deposit of $50000 from game",
      "tx-1"
    );
  });
});

describe("withdraw", () => {
  it("debits wallet and creates bridge transaction", async () => {
    vi.mocked(farmRepo.findFarmById).mockResolvedValue(mockFarm);
    vi.mocked(walletRepo.addLedgerEntry).mockResolvedValue({
      ...mockLedgerEntry,
      amount: -25000n,
      type: "withdrawal",
    });
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      id: "tx-2",
      type: "wallet_withdrawal",
      amount: 25000,
      senderId: "user-1",
      recipientFarmId: "farm-1",
      gameServerId: "server-1",
      farmSlot: 3,
      status: "pending",
      equipmentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      bridgePickedUpAt: null,
      deliveredAt: null,
      confirmedAt: null,
    });

    const result = await withdraw("user-1", { amount: 25000, farmId: "farm-1" });
    expect(walletRepo.addLedgerEntry).toHaveBeenCalledWith(
      "user-1",
      -25000n,
      "withdrawal",
      "Withdrawal of $25000 to game"
    );
    expect(prisma.transaction.create).toHaveBeenCalled();
    expect(result.type).toBe("withdrawal");
  });

  it("rejects if farm not found", async () => {
    vi.mocked(farmRepo.findFarmById).mockResolvedValue(null);
    await expect(withdraw("user-1", { amount: 25000, farmId: "farm-x" })).rejects.toThrow("Farm not found");
  });
});

describe("transfer", () => {
  it("debits sender and credits receiver", async () => {
    vi.mocked(walletRepo.addLedgerEntry).mockResolvedValue(mockLedgerEntry);

    await transfer("user-1", { toUserId: "user-2", amount: 10000 });

    expect(walletRepo.addLedgerEntry).toHaveBeenCalledTimes(2);
    expect(walletRepo.addLedgerEntry).toHaveBeenCalledWith(
      "user-1",
      -10000n,
      "transfer_out",
      "Transfer of $10000"
    );
    expect(walletRepo.addLedgerEntry).toHaveBeenCalledWith(
      "user-2",
      10000n,
      "transfer_in",
      "Transfer of $10000"
    );
  });

  it("rejects self-transfer", async () => {
    await expect(
      transfer("user-1", { toUserId: "user-1", amount: 10000 })
    ).rejects.toThrow("Cannot transfer to yourself");
  });
});

describe("getLedger", () => {
  it("returns ledger entries as DTOs", async () => {
    vi.mocked(walletRepo.getLedgerEntries).mockResolvedValue([mockLedgerEntry]);

    const result = await getLedger("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe("50000");
    expect(result[0].type).toBe("deposit");
  });
});
