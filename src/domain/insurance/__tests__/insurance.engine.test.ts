import { describe, it, expect } from "vitest";
import {
  calculatePremium,
  calculateCropPayout,
  calculateGeneralPayout,
} from "../insurance.engine";

describe("calculatePremium", () => {
  it("calculates annual premium correctly", () => {
    // 100,000 coverage at 3% (300 bp) for 365 days = 3,000
    const premium = calculatePremium(100000n, 300, 365);
    expect(premium).toBe(3000n);
  });

  it("prorates for shorter terms", () => {
    // 100,000 at 3% for 90 days = 100000 * 300 * 90 / (10000 * 365) ≈ 739
    const premium = calculatePremium(100000n, 300, 90);
    expect(premium).toBeGreaterThanOrEqual(739n);
    expect(premium).toBeLessThanOrEqual(740n);
  });

  it("returns 0 for zero coverage", () => {
    expect(calculatePremium(0n, 300, 365)).toBe(0n);
  });

  it("returns 0 for zero rate", () => {
    expect(calculatePremium(100000n, 0, 365)).toBe(0n);
  });

  it("returns 0 for zero days", () => {
    expect(calculatePremium(100000n, 300, 0)).toBe(0n);
  });
});

describe("calculateCropPayout", () => {
  it("pays out when price drops below strike", () => {
    // Strike 1000, current 800, qty 10, deductible 0, coverage 50000
    // Payout = (1000 - 800) * 10 = 2000
    const payout = calculateCropPayout(1000n, 800n, 10, 0n, 50000n);
    expect(payout).toBe(2000n);
  });

  it("subtracts deductible", () => {
    // Strike 1000, current 800, qty 10, deductible 500, coverage 50000
    // Payout = 2000 - 500 = 1500
    const payout = calculateCropPayout(1000n, 800n, 10, 500n, 50000n);
    expect(payout).toBe(1500n);
  });

  it("returns 0 when price at or above strike", () => {
    expect(calculateCropPayout(1000n, 1000n, 10, 0n, 50000n)).toBe(0n);
    expect(calculateCropPayout(1000n, 1200n, 10, 0n, 50000n)).toBe(0n);
  });

  it("caps payout at coverage amount", () => {
    // Strike 1000, current 0, qty 100, deductible 0, coverage 5000
    // Loss = 100,000 but capped at 5000
    const payout = calculateCropPayout(1000n, 0n, 100, 0n, 5000n);
    expect(payout).toBe(5000n);
  });

  it("returns 0 when deductible exceeds loss", () => {
    // Strike 1000, current 900, qty 1, deductible 200
    // Loss = 100, deductible = 200 => 0
    const payout = calculateCropPayout(1000n, 900n, 1, 200n, 50000n);
    expect(payout).toBe(0n);
  });
});

describe("calculateGeneralPayout", () => {
  it("pays claim minus deductible", () => {
    const payout = calculateGeneralPayout(10000n, 1000n, 50000n);
    expect(payout).toBe(9000n);
  });

  it("caps at coverage amount", () => {
    const payout = calculateGeneralPayout(100000n, 0n, 50000n);
    expect(payout).toBe(50000n);
  });

  it("returns 0 when deductible exceeds claim", () => {
    const payout = calculateGeneralPayout(500n, 1000n, 50000n);
    expect(payout).toBe(0n);
  });

  it("returns 0 for zero claim", () => {
    expect(calculateGeneralPayout(0n, 0n, 50000n)).toBe(0n);
  });
});
