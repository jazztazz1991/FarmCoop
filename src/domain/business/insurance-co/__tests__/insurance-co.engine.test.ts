import { describe, it, expect } from "vitest";
import { getCustomRiskRate, suggestPayout } from "../insurance-co.engine";

describe("insurance-co.engine", () => {
  describe("getCustomRiskRate", () => {
    it("returns custom rate from settings", () => {
      expect(getCustomRiskRate({ riskRates: { crop: 400 } }, "crop")).toBe(400);
    });
    it("returns default for missing type", () => {
      expect(getCustomRiskRate({ riskRates: {} }, "crop")).toBe(300);
    });
    it("returns default for no settings", () => {
      expect(getCustomRiskRate({}, "vehicle")).toBe(500);
    });
    it("returns default for invalid rate", () => {
      expect(getCustomRiskRate({ riskRates: { crop: "bad" } }, "crop")).toBe(300);
    });
  });

  describe("suggestPayout", () => {
    it("returns claim minus deductible", () => {
      expect(suggestPayout(10000n, 1000n, 50000n)).toBe(9000n);
    });
    it("caps at coverage amount", () => {
      expect(suggestPayout(100000n, 1000n, 50000n)).toBe(50000n);
    });
    it("returns 0 for claim less than deductible", () => {
      expect(suggestPayout(500n, 1000n, 50000n)).toBe(0n);
    });
    it("returns 0 for zero claim", () => {
      expect(suggestPayout(0n, 1000n, 50000n)).toBe(0n);
    });
  });
});
