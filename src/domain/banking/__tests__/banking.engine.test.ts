import { describe, it, expect } from "vitest";
import {
  calculateMonthlyPayment,
  calculateInterestAccrual,
  calculateCDPayout,
  calculateEarlyWithdrawalPenalty,
} from "../banking.engine";

describe("calculateMonthlyPayment", () => {
  it("returns correct payment for a simple loan", () => {
    // 100,000 loan at 12% (1200 basis points) for 12 months
    // Monthly rate = 1% => payment ≈ 8,885
    const payment = calculateMonthlyPayment(100000n, 1200, 12);
    // Verify it's in the right ballpark (8,800 - 9,000)
    expect(payment).toBeGreaterThanOrEqual(8800n);
    expect(payment).toBeLessThanOrEqual(9000n);
  });

  it("returns principal / termMonths when interest rate is 0", () => {
    const payment = calculateMonthlyPayment(120000n, 0, 12);
    expect(payment).toBe(10000n);
  });

  it("handles single month term", () => {
    const payment = calculateMonthlyPayment(10000n, 1200, 1);
    // Should be principal + one month interest = 10000 + 100 = 10100
    expect(payment).toBe(10100n);
  });

  it("returns 0n for zero principal", () => {
    expect(calculateMonthlyPayment(0n, 500, 12)).toBe(0n);
  });

  it("handles large loan amounts with BigInt precision", () => {
    const payment = calculateMonthlyPayment(10000000n, 500, 60);
    // 10M at 5% for 60 months => ~188,712/month
    expect(payment).toBeGreaterThan(180000n);
    expect(payment).toBeLessThan(200000n);
  });
});

describe("calculateInterestAccrual", () => {
  it("accrues daily interest correctly", () => {
    // 1,000,000 balance at 3.65% (365 bp) for 1 day = ~100
    const interest = calculateInterestAccrual(1000000n, 365, 1);
    expect(interest).toBe(100n);
  });

  it("accrues for multiple days", () => {
    // 1,000,000 at 3.65% for 30 days = ~3,000
    const interest = calculateInterestAccrual(1000000n, 365, 30);
    expect(interest).toBe(3000n);
  });

  it("returns 0 for zero balance", () => {
    expect(calculateInterestAccrual(0n, 500, 30)).toBe(0n);
  });

  it("returns 0 for zero rate", () => {
    expect(calculateInterestAccrual(1000000n, 0, 30)).toBe(0n);
  });

  it("returns 0 for zero days", () => {
    expect(calculateInterestAccrual(1000000n, 500, 0)).toBe(0n);
  });

  it("handles small balances without rounding to zero prematurely", () => {
    // 10,000 at 2% (200 bp) for 365 days = 200
    const interest = calculateInterestAccrual(10000n, 200, 365);
    expect(interest).toBe(200n);
  });
});

describe("calculateCDPayout", () => {
  it("returns principal + earned interest at maturity", () => {
    // 100,000 at 5% (500 bp) for 365 days = 100,000 + 5,000 = 105,000
    const payout = calculateCDPayout(100000n, 500, 365);
    expect(payout).toBe(105000n);
  });

  it("prorates for shorter terms", () => {
    // 100,000 at 5% for 90 days = 100,000 + (5000 * 90/365) ≈ 101,232
    const payout = calculateCDPayout(100000n, 500, 90);
    expect(payout).toBeGreaterThanOrEqual(101230n);
    expect(payout).toBeLessThanOrEqual(101240n);
  });

  it("returns principal when rate is 0", () => {
    expect(calculateCDPayout(100000n, 0, 365)).toBe(100000n);
  });

  it("returns 0 for zero principal", () => {
    expect(calculateCDPayout(0n, 500, 365)).toBe(0n);
  });
});

describe("calculateEarlyWithdrawalPenalty", () => {
  it("applies penalty for early withdrawal", () => {
    // 100,000 at 5%, held 180 days of 365-day term
    // 90-day penalty = 100,000 * 500 * 90 / (10000 * 365) ≈ 1,232
    // Earned = 100,000 * 500 * 180 / (10000 * 365) ≈ 2,465
    // Penalty (1232) < earned (2465), so full penalty applies
    const penalty = calculateEarlyWithdrawalPenalty(100000n, 500, 180, 365);
    expect(penalty).toBeGreaterThanOrEqual(1230n);
    expect(penalty).toBeLessThanOrEqual(1240n);
  });

  it("returns 0 penalty if held for full term", () => {
    const penalty = calculateEarlyWithdrawalPenalty(100000n, 500, 365, 365);
    expect(penalty).toBe(0n);
  });

  it("returns 0 for zero principal", () => {
    expect(calculateEarlyWithdrawalPenalty(0n, 500, 30, 365)).toBe(0n);
  });

  it("caps penalty at earned interest", () => {
    // If held 10 days, earned interest = 100,000 * 500 * 10 / (10000 * 365) ≈ 136
    // 90-day penalty = ~1232, but should be capped at earned = 136
    const penalty = calculateEarlyWithdrawalPenalty(100000n, 500, 10, 365);
    const earnedInterest = calculateInterestAccrual(100000n, 500, 10);
    expect(penalty).toBeLessThanOrEqual(earnedInterest);
  });
});
