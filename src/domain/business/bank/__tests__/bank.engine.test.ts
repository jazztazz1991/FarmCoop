import { describe, it, expect } from "vitest";
import { getInterestRate, getMaxLoanAmount, isLoanWithinLimits } from "../bank.engine";

describe("bank.engine", () => {
  describe("getInterestRate", () => {
    it("returns rate from settings", () => {
      expect(getInterestRate({ interestRateBp: 800 })).toBe(800);
    });
    it("returns default 500 for missing settings", () => {
      expect(getInterestRate({})).toBe(500);
    });
    it("returns default for invalid type", () => {
      expect(getInterestRate({ interestRateBp: "bad" })).toBe(500);
    });
    it("returns default for negative rate", () => {
      expect(getInterestRate({ interestRateBp: -1 })).toBe(500);
    });
    it("accepts zero rate", () => {
      expect(getInterestRate({ interestRateBp: 0 })).toBe(0);
    });
  });

  describe("getMaxLoanAmount", () => {
    it("returns amount from settings", () => {
      expect(getMaxLoanAmount({ maxLoanAmount: "5000000" })).toBe(5000000n);
    });
    it("returns default for missing", () => {
      expect(getMaxLoanAmount({})).toBe(1000000n);
    });
    it("returns default for invalid string", () => {
      expect(getMaxLoanAmount({ maxLoanAmount: "bad" })).toBe(1000000n);
    });
  });

  describe("isLoanWithinLimits", () => {
    it("returns true for valid amount", () => {
      expect(isLoanWithinLimits(500000n, 1000000n)).toBe(true);
    });
    it("returns true for exact max", () => {
      expect(isLoanWithinLimits(1000000n, 1000000n)).toBe(true);
    });
    it("returns false for amount over max", () => {
      expect(isLoanWithinLimits(1000001n, 1000000n)).toBe(false);
    });
    it("returns false for zero amount", () => {
      expect(isLoanWithinLimits(0n, 1000000n)).toBe(false);
    });
  });
});
