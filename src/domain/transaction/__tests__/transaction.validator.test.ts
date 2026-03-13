import { describe, it, expect } from "vitest";
import {
  createTransactionSchema,
  isValidStatusTransition,
  updateStatusSchema,
} from "../transaction.validator";

const baseInput = {
  senderId: "user-1",
  recipientFarmId: "farm-1",
  gameServerId: "server-1",
  farmSlot: 1,
};

describe("createTransactionSchema", () => {
  it("accepts a valid money transaction", () => {
    const result = createTransactionSchema.safeParse({
      type: "money",
      ...baseInput,
      amount: 50000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid equipment transaction", () => {
    const result = createTransactionSchema.safeParse({
      type: "equipment",
      ...baseInput,
      equipmentId: "data/vehicles/fendt/vario700/vario700.xml",
    });
    expect(result.success).toBe(true);
  });

  it("accepts wallet_deposit type", () => {
    const result = createTransactionSchema.safeParse({
      type: "wallet_deposit",
      ...baseInput,
      amount: 300000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts wallet_withdrawal type", () => {
    const result = createTransactionSchema.safeParse({
      type: "wallet_withdrawal",
      ...baseInput,
      amount: 50000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects money transaction without amount", () => {
    const result = createTransactionSchema.safeParse({
      type: "money",
      ...baseInput,
    });
    expect(result.success).toBe(false);
  });

  it("rejects equipment transaction without equipmentId", () => {
    const result = createTransactionSchema.safeParse({
      type: "equipment",
      ...baseInput,
    });
    expect(result.success).toBe(false);
  });

  it("rejects farmSlot less than 1", () => {
    const result = createTransactionSchema.safeParse({
      type: "money",
      ...baseInput,
      farmSlot: 0,
      amount: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects farmSlot greater than 16", () => {
    const result = createTransactionSchema.safeParse({
      type: "money",
      ...baseInput,
      farmSlot: 17,
      amount: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = createTransactionSchema.safeParse({
      type: "money",
      ...baseInput,
      amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer farmSlot", () => {
    const result = createTransactionSchema.safeParse({
      type: "money",
      ...baseInput,
      farmSlot: 1.5,
      amount: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid transaction type", () => {
    const result = createTransactionSchema.safeParse({
      type: "invalid",
      ...baseInput,
    });
    expect(result.success).toBe(false);
  });

  it("rejects wallet_deposit without amount", () => {
    const result = createTransactionSchema.safeParse({
      type: "wallet_deposit",
      ...baseInput,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing senderId", () => {
    const result = createTransactionSchema.safeParse({
      type: "money",
      recipientFarmId: "farm-1",
      gameServerId: "server-1",
      farmSlot: 1,
      amount: 1000,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateStatusSchema", () => {
  it("accepts delivered", () => {
    expect(updateStatusSchema.safeParse({ status: "delivered" }).success).toBe(
      true
    );
  });

  it("accepts confirmed", () => {
    expect(updateStatusSchema.safeParse({ status: "confirmed" }).success).toBe(
      true
    );
  });

  it("accepts failed", () => {
    expect(updateStatusSchema.safeParse({ status: "failed" }).success).toBe(
      true
    );
  });

  it("rejects pending as an update target", () => {
    expect(updateStatusSchema.safeParse({ status: "pending" }).success).toBe(
      false
    );
  });
});

describe("isValidStatusTransition", () => {
  it("allows pending -> delivered", () => {
    expect(isValidStatusTransition("pending", "delivered")).toBe(true);
  });

  it("allows pending -> failed", () => {
    expect(isValidStatusTransition("pending", "failed")).toBe(true);
  });

  it("allows delivered -> confirmed", () => {
    expect(isValidStatusTransition("delivered", "confirmed")).toBe(true);
  });

  it("allows delivered -> failed", () => {
    expect(isValidStatusTransition("delivered", "failed")).toBe(true);
  });

  it("disallows confirmed -> anything", () => {
    expect(isValidStatusTransition("confirmed", "pending")).toBe(false);
    expect(isValidStatusTransition("confirmed", "delivered")).toBe(false);
    expect(isValidStatusTransition("confirmed", "failed")).toBe(false);
  });

  it("disallows failed -> anything", () => {
    expect(isValidStatusTransition("failed", "pending")).toBe(false);
    expect(isValidStatusTransition("failed", "delivered")).toBe(false);
  });

  it("disallows skipping delivered (pending -> confirmed)", () => {
    expect(isValidStatusTransition("pending", "confirmed")).toBe(false);
  });
});
