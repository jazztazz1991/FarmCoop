import { describe, it, expect } from "vitest";
import {
  canCreateBusiness,
  getCareerForBusinessType,
  getBusinessTypeForCareer,
} from "../business.engine";

describe("business.engine", () => {
  describe("canCreateBusiness", () => {
    it("allows banker to create bank", () => {
      expect(canCreateBusiness("banker", "bank")).toBe(true);
    });

    it("allows dealer to create dealership", () => {
      expect(canCreateBusiness("dealer", "dealership")).toBe(true);
    });

    it("allows inspector to create insurance", () => {
      expect(canCreateBusiness("inspector", "insurance")).toBe(true);
    });

    it("allows trucker to create trucking", () => {
      expect(canCreateBusiness("trucker", "trucking")).toBe(true);
    });

    it("rejects farmer creating any business", () => {
      expect(canCreateBusiness("farmer", "bank")).toBe(false);
      expect(canCreateBusiness("farmer", "dealership")).toBe(false);
      expect(canCreateBusiness("farmer", "insurance")).toBe(false);
      expect(canCreateBusiness("farmer", "trucking")).toBe(false);
    });

    it("rejects wrong career for business type", () => {
      expect(canCreateBusiness("banker", "dealership")).toBe(false);
      expect(canCreateBusiness("dealer", "bank")).toBe(false);
      expect(canCreateBusiness("inspector", "trucking")).toBe(false);
      expect(canCreateBusiness("trucker", "insurance")).toBe(false);
    });

    it("rejects unknown career", () => {
      expect(canCreateBusiness("pirate", "bank")).toBe(false);
    });
  });

  describe("getCareerForBusinessType", () => {
    it("returns banker for bank", () => {
      expect(getCareerForBusinessType("bank")).toBe("banker");
    });

    it("returns dealer for dealership", () => {
      expect(getCareerForBusinessType("dealership")).toBe("dealer");
    });

    it("returns inspector for insurance", () => {
      expect(getCareerForBusinessType("insurance")).toBe("inspector");
    });

    it("returns trucker for trucking", () => {
      expect(getCareerForBusinessType("trucking")).toBe("trucker");
    });
  });

  describe("getBusinessTypeForCareer", () => {
    it("returns bank for banker", () => {
      expect(getBusinessTypeForCareer("banker")).toBe("bank");
    });

    it("returns dealership for dealer", () => {
      expect(getBusinessTypeForCareer("dealer")).toBe("dealership");
    });

    it("returns null for farmer", () => {
      expect(getBusinessTypeForCareer("farmer")).toBeNull();
    });

    it("returns null for unknown career", () => {
      expect(getBusinessTypeForCareer("pirate")).toBeNull();
    });
  });
});
