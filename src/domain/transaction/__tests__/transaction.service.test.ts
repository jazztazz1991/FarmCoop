import { describe, it, expect, vi, beforeEach } from "vitest";
import { toDTO, createTransaction, updateStatus, listTransactions } from "../transaction.service";
import type { Transaction } from "../transaction.model";

vi.mock("../transaction.repository", () => ({
  createTransaction: vi.fn(),
  findTransactions: vi.fn(),
  findTransactionById: vi.fn(),
  updateTransactionStatus: vi.fn(),
}));

import * as repo from "../transaction.repository";

const mockTransaction: Transaction = {
  id: "test-id-1",
  type: "money",
  amount: 50000,
  equipmentId: null,
  status: "pending",
  senderId: "user-1",
  recipientFarmId: "farm-1",
  gameServerId: "server-1",
  farmSlot: 1,
  createdAt: new Date("2026-03-12T00:00:00Z"),
  updatedAt: new Date("2026-03-12T00:00:00Z"),
  bridgePickedUpAt: null,
  deliveredAt: null,
  confirmedAt: null,
};

describe("toDTO", () => {
  it("maps Transaction to TransactionDTO with allowlisted fields", () => {
    const dto = toDTO(mockTransaction);
    expect(dto).toEqual({
      id: "test-id-1",
      type: "money",
      farmId: 1, // farmSlot mapped to farmId for bridge/mod
      gameServerId: "server-1",
      amount: 50000,
      equipmentId: null,
      status: "pending",
      senderId: "user-1",
      createdAt: "2026-03-12T00:00:00.000Z",
    });
    expect(dto).not.toHaveProperty("updatedAt");
    expect(dto).not.toHaveProperty("bridgePickedUpAt");
    expect(dto).not.toHaveProperty("deliveredAt");
    expect(dto).not.toHaveProperty("confirmedAt");
  });
});

describe("createTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a money transaction", async () => {
    vi.mocked(repo.createTransaction).mockResolvedValue(mockTransaction);

    const result = await createTransaction({
      type: "money",
      senderId: "user-1",
      recipientFarmId: "farm-1",
      gameServerId: "server-1",
      farmSlot: 1,
      amount: 50000,
    });

    expect(repo.createTransaction).toHaveBeenCalledWith({
      type: "money",
      senderId: "user-1",
      recipientFarmId: "farm-1",
      gameServerId: "server-1",
      farmSlot: 1,
      amount: 50000,
    });
    expect(result.id).toBe("test-id-1");
    expect(result.status).toBe("pending");
  });

  it("creates an equipment transaction", async () => {
    const equipTx: Transaction = {
      ...mockTransaction,
      type: "equipment",
      amount: null,
      equipmentId: "data/vehicles/fendt/vario700/vario700.xml",
    };
    vi.mocked(repo.createTransaction).mockResolvedValue(equipTx);

    const result = await createTransaction({
      type: "equipment",
      senderId: "user-1",
      recipientFarmId: "farm-1",
      gameServerId: "server-1",
      farmSlot: 1,
      equipmentId: "data/vehicles/fendt/vario700/vario700.xml",
    });

    expect(result.equipmentId).toBe(
      "data/vehicles/fendt/vario700/vario700.xml"
    );
  });

  it("rejects invalid input (money without amount)", async () => {
    await expect(
      createTransaction({
        type: "money",
        senderId: "user-1",
        recipientFarmId: "farm-1",
        gameServerId: "server-1",
        farmSlot: 1,
      })
    ).rejects.toThrow();
  });
});

describe("listTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all transactions as DTOs", async () => {
    vi.mocked(repo.findTransactions).mockResolvedValue([mockTransaction]);

    const result = await listTransactions();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("test-id-1");
  });

  it("filters by status", async () => {
    vi.mocked(repo.findTransactions).mockResolvedValue([]);

    await listTransactions("pending");
    expect(repo.findTransactions).toHaveBeenCalledWith({ status: "pending" });
  });
});

describe("updateStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates pending to delivered", async () => {
    vi.mocked(repo.findTransactionById).mockResolvedValue(mockTransaction);
    vi.mocked(repo.updateTransactionStatus).mockResolvedValue({
      ...mockTransaction,
      status: "delivered",
    });

    const result = await updateStatus("test-id-1", "delivered");
    expect(result.status).toBe("delivered");
  });

  it("rejects invalid transition (pending -> confirmed)", async () => {
    vi.mocked(repo.findTransactionById).mockResolvedValue(mockTransaction);

    await expect(updateStatus("test-id-1", "confirmed")).rejects.toThrow(
      "Invalid status transition"
    );
  });

  it("throws for non-existent transaction", async () => {
    vi.mocked(repo.findTransactionById).mockResolvedValue(null);

    await expect(updateStatus("nonexistent", "delivered")).rejects.toThrow(
      "Transaction not found"
    );
  });

  it("rejects invalid status value", async () => {
    await expect(updateStatus("test-id-1", "bogus")).rejects.toThrow();
  });
});
