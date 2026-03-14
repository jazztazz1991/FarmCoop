import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../bank.repository");
vi.mock("../../business.repository");

import * as bankRepo from "../bank.repository";
import * as bizRepo from "../../business.repository";
import { applyForLoan, getApplications, reviewApplication, getLoans, makePayment } from "../bank.service";

const mockBusiness = {
  id: "biz-1",
  ownerId: "owner-1",
  ownerName: "BankOwner",
  gameServerId: "srv-1",
  serverName: "TestServer",
  type: "bank",
  name: "Test Bank",
  description: "",
  status: "active",
  settings: { interestRateBp: 500, maxLoanAmount: "1000000" },
  createdAt: new Date().toISOString(),
};

const mockApplication = {
  id: "app-1",
  businessId: "biz-1",
  business: { name: "Test Bank" },
  applicantId: "user-1",
  applicant: { displayName: "Borrower" },
  principal: 50000n,
  termMonths: 12,
  status: "pending",
  denialReason: null,
  reviewedAt: null,
  createdAt: new Date(),
};

const mockLoan = {
  id: "loan-1",
  businessId: "biz-1",
  business: { name: "Test Bank" },
  borrowerId: "user-1",
  borrower: { displayName: "Borrower" },
  principal: 50000n,
  interestRate: 500,
  remainingBalance: 50000n,
  monthlyPayment: 4280n,
  termMonths: 12,
  paymentsRemaining: 12,
  status: "active",
  nextPaymentDue: new Date(),
  createdAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("bank.service", () => {
  describe("applyForLoan", () => {
    it("creates a loan application", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(bankRepo.createApplication).mockResolvedValue(mockApplication);

      const result = await applyForLoan("user-1", "biz-1", {
        principal: "50000",
        termMonths: 12,
      });

      expect(result.id).toBe("app-1");
      expect(result.principal).toBe("50000");
      expect(result.status).toBe("pending");
    });

    it("rejects if business is not a bank", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue({
        ...mockBusiness,
        type: "dealership",
      } as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);

      await expect(
        applyForLoan("user-1", "biz-1", { principal: "50000", termMonths: 12 })
      ).rejects.toThrow("Not a bank");
    });

    it("rejects if loan exceeds max", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);

      await expect(
        applyForLoan("user-1", "biz-1", { principal: "9999999", termMonths: 12 })
      ).rejects.toThrow("exceeds bank limit");
    });
  });

  describe("getApplications", () => {
    it("returns applications for bank owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(bankRepo.findApplicationsByBusiness).mockResolvedValue([mockApplication]);

      const result = await getApplications("owner-1", "biz-1");
      expect(result).toHaveLength(1);
      expect(result[0].applicantName).toBe("Borrower");
    });

    it("rejects non-owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);

      await expect(getApplications("other-user", "biz-1")).rejects.toThrow("Not the bank owner");
    });
  });

  describe("reviewApplication", () => {
    it("denies application with reason", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(bankRepo.findApplicationById).mockResolvedValue(mockApplication);
      vi.mocked(bankRepo.denyApplication).mockResolvedValue({
        ...mockApplication,
        status: "denied",
        denialReason: "Too risky",
        reviewedAt: new Date(),
      });

      const result = await reviewApplication("owner-1", "biz-1", "app-1", {
        decision: "deny",
        denialReason: "Too risky",
      });
      expect(result.status).toBe("denied");
    });

    it("approves application and creates loan", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(bankRepo.findApplicationById).mockResolvedValue(mockApplication);
      vi.mocked(bankRepo.approveApplication).mockResolvedValue(mockLoan);

      const result = await reviewApplication("owner-1", "biz-1", "app-1", {
        decision: "approve",
      });
      expect(result.id).toBe("loan-1");
    });

    it("rejects already reviewed", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(bankRepo.findApplicationById).mockResolvedValue({
        ...mockApplication,
        status: "approved",
      });

      await expect(
        reviewApplication("owner-1", "biz-1", "app-1", { decision: "approve" })
      ).rejects.toThrow("already reviewed");
    });
  });

  describe("getLoans", () => {
    it("returns all loans for bank owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(bankRepo.findLoansByBusiness).mockResolvedValue([mockLoan]);

      const result = await getLoans("owner-1", "biz-1");
      expect(result).toHaveLength(1);
    });

    it("returns borrower's loans only for non-owner", async () => {
      vi.mocked(bizRepo.findBusinessById).mockResolvedValue(mockBusiness as ReturnType<typeof bizRepo.findBusinessById> extends Promise<infer T> ? T : never);
      vi.mocked(bankRepo.findLoansByBorrower).mockResolvedValue([mockLoan]);

      const result = await getLoans("user-1", "biz-1");
      expect(result).toHaveLength(1);
      expect(bankRepo.findLoansByBorrower).toHaveBeenCalledWith("biz-1", "user-1");
    });
  });

  describe("makePayment", () => {
    it("makes a payment on active loan", async () => {
      vi.mocked(bankRepo.findLoanById).mockResolvedValue(mockLoan);
      vi.mocked(bankRepo.makePayment).mockResolvedValue({
        ...mockLoan,
        remainingBalance: 45720n,
        paymentsRemaining: 11,
      });

      const result = await makePayment("user-1", "biz-1", "loan-1");
      expect(result.paymentsRemaining).toBe(11);
    });

    it("rejects non-borrower", async () => {
      vi.mocked(bankRepo.findLoanById).mockResolvedValue(mockLoan);

      await expect(makePayment("other-user", "biz-1", "loan-1")).rejects.toThrow("Not the borrower");
    });

    it("rejects paid off loan", async () => {
      vi.mocked(bankRepo.findLoanById).mockResolvedValue({ ...mockLoan, status: "paid_off" });

      await expect(makePayment("user-1", "biz-1", "loan-1")).rejects.toThrow("not active");
    });
  });
});
