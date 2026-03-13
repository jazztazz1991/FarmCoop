import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  applyForLoan,
  makePayment,
  getMyLoans,
  getSavings,
  depositToSavings,
  withdrawFromSavings,
  accrueInterest,
  openCertificate,
  withdrawCertificate,
  getMyCertificates,
  matureCertificates,
  toLoanDTO,
  toSavingsDTO,
  toCertificateDTO,
} from "../banking.service";

vi.mock("../banking.repository", () => ({
  disburseLoan: vi.fn(),
  makeLoanPayment: vi.fn(),
  findLoansByBorrower: vi.fn(),
  findLoanById: vi.fn(),
  findActiveLoans: vi.fn(),
  findOverdueLoans: vi.fn(),
  defaultLoan: vi.fn(),
  findOrCreateSavings: vi.fn(),
  depositToSavings: vi.fn(),
  withdrawFromSavings: vi.fn(),
  accrueSavingsInterest: vi.fn(),
  findAllActiveSavings: vi.fn(),
  openCertificate: vi.fn(),
  withdrawCertificate: vi.fn(),
  findCertificatesByUser: vi.fn(),
  findCertificateById: vi.fn(),
  findMaturedCertificates: vi.fn(),
}));

vi.mock("../../notification/notification.service", () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

import * as bankingRepo from "../banking.repository";

const mockRepo = bankingRepo as unknown as {
  disburseLoan: ReturnType<typeof vi.fn>;
  makeLoanPayment: ReturnType<typeof vi.fn>;
  findLoansByBorrower: ReturnType<typeof vi.fn>;
  findLoanById: ReturnType<typeof vi.fn>;
  findActiveLoans: ReturnType<typeof vi.fn>;
  findOverdueLoans: ReturnType<typeof vi.fn>;
  defaultLoan: ReturnType<typeof vi.fn>;
  findOrCreateSavings: ReturnType<typeof vi.fn>;
  depositToSavings: ReturnType<typeof vi.fn>;
  withdrawFromSavings: ReturnType<typeof vi.fn>;
  accrueSavingsInterest: ReturnType<typeof vi.fn>;
  findAllActiveSavings: ReturnType<typeof vi.fn>;
  openCertificate: ReturnType<typeof vi.fn>;
  withdrawCertificate: ReturnType<typeof vi.fn>;
  findCertificatesByUser: ReturnType<typeof vi.fn>;
  findCertificateById: ReturnType<typeof vi.fn>;
  findMaturedCertificates: ReturnType<typeof vi.fn>;
};

function makeMockLoan(overrides = {}) {
  return {
    id: "loan-1",
    borrowerId: "user-1",
    gameServerId: "server-1",
    principal: 100000n,
    interestRate: 500,
    remainingBalance: 105000n,
    monthlyPayment: 8750n,
    termMonths: 12,
    paymentsRemaining: 12,
    status: "active",
    nextPaymentDue: new Date("2026-04-12"),
    disbursedAt: new Date("2026-03-12"),
    paidOffAt: null,
    createdAt: new Date("2026-03-12"),
    ...overrides,
  };
}

function makeMockSavings(overrides = {}) {
  return {
    id: "savings-1",
    userId: "user-1",
    gameServerId: "server-1",
    balance: 50000n,
    apyBasisPoints: 200,
    lastAccrualAt: new Date("2026-03-01"),
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function makeMockCertificate(overrides = {}) {
  return {
    id: "cert-1",
    userId: "user-1",
    gameServerId: "server-1",
    principal: 100000n,
    apyBasisPoints: 500,
    termDays: 180,
    maturesAt: new Date("2026-09-12"),
    status: "active",
    createdAt: new Date("2026-03-12"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── DTO Mappers ──────────────────────────────────────────

describe("toLoanDTO", () => {
  it("serializes BigInt fields as strings and dates as ISO", () => {
    const loan = makeMockLoan();
    const dto = toLoanDTO(loan);
    expect(dto.principal).toBe("100000");
    expect(dto.remainingBalance).toBe("105000");
    expect(dto.monthlyPayment).toBe("8750");
    expect(dto.disbursedAt).toBe("2026-03-12T00:00:00.000Z");
    expect(dto.paidOffAt).toBeNull();
  });
});

describe("toSavingsDTO", () => {
  it("serializes balance as string", () => {
    const savings = makeMockSavings();
    const dto = toSavingsDTO(savings);
    expect(dto.balance).toBe("50000");
    expect(dto.apyBasisPoints).toBe(200);
  });
});

describe("toCertificateDTO", () => {
  it("serializes principal as string and maturesAt as ISO", () => {
    const cert = makeMockCertificate();
    const dto = toCertificateDTO(cert);
    expect(dto.principal).toBe("100000");
    expect(dto.maturesAt).toBe("2026-09-12T00:00:00.000Z");
  });
});

// ── Loans ────────────────────────────────────────────────

describe("applyForLoan", () => {
  it("validates input, calculates payment, and disburses", async () => {
    mockRepo.findActiveLoans.mockResolvedValue([]);
    mockRepo.findLoansByBorrower.mockResolvedValue([]);
    mockRepo.disburseLoan.mockResolvedValue(makeMockLoan());

    const result = await applyForLoan("user-1", {
      gameServerId: "server-1",
      principal: "100000",
      termMonths: 12,
    });

    expect(mockRepo.disburseLoan).toHaveBeenCalledOnce();
    expect(result.id).toBe("loan-1");
    expect(result.principal).toBe("100000");
  });

  it("rejects if borrower has defaulted loan", async () => {
    mockRepo.findActiveLoans.mockResolvedValue([]);
    mockRepo.findLoansByBorrower.mockResolvedValue([
      makeMockLoan({ status: "defaulted" }),
    ]);

    await expect(
      applyForLoan("user-1", {
        gameServerId: "server-1",
        principal: "100000",
        termMonths: 12,
      })
    ).rejects.toThrow("Cannot take new loans while in default");
  });

  it("rejects if at max active loans", async () => {
    mockRepo.findActiveLoans.mockResolvedValue([
      makeMockLoan(),
      makeMockLoan({ id: "loan-2" }),
      makeMockLoan({ id: "loan-3" }),
    ]);
    mockRepo.findLoansByBorrower.mockResolvedValue([]);

    await expect(
      applyForLoan("user-1", {
        gameServerId: "server-1",
        principal: "100000",
        termMonths: 12,
      })
    ).rejects.toThrow("Maximum 3 active loans allowed");
  });

  it("rejects invalid input", async () => {
    await expect(
      applyForLoan("user-1", {
        gameServerId: "server-1",
        principal: "-100",
        termMonths: 12,
      })
    ).rejects.toThrow();
  });
});

describe("makePayment", () => {
  it("makes a payment and returns updated loan", async () => {
    const loan = makeMockLoan();
    mockRepo.findLoanById.mockResolvedValue(loan);
    mockRepo.makeLoanPayment.mockResolvedValue(
      makeMockLoan({ paymentsRemaining: 11, remainingBalance: 96250n })
    );

    const result = await makePayment("loan-1", "user-1");
    expect(mockRepo.makeLoanPayment).toHaveBeenCalledOnce();
    expect(result.paymentsRemaining).toBe(11);
  });

  it("rejects if loan not found", async () => {
    mockRepo.findLoanById.mockResolvedValue(null);
    await expect(makePayment("bad-id", "user-1")).rejects.toThrow("Loan not found");
  });

  it("rejects if not the borrower", async () => {
    mockRepo.findLoanById.mockResolvedValue(makeMockLoan());
    await expect(makePayment("loan-1", "other-user")).rejects.toThrow("Not your loan");
  });

  it("rejects if loan not active", async () => {
    mockRepo.findLoanById.mockResolvedValue(makeMockLoan({ status: "paid_off" }));
    await expect(makePayment("loan-1", "user-1")).rejects.toThrow("Loan is not active");
  });
});

describe("getMyLoans", () => {
  it("returns loan DTOs", async () => {
    mockRepo.findLoansByBorrower.mockResolvedValue([makeMockLoan()]);
    const result = await getMyLoans("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("loan-1");
  });
});

// ── Savings ──────────────────────────────────────────────

describe("getSavings", () => {
  it("returns savings DTO", async () => {
    mockRepo.findOrCreateSavings.mockResolvedValue(makeMockSavings());
    const result = await getSavings("user-1", "server-1");
    expect(result.balance).toBe("50000");
  });
});

describe("depositToSavings", () => {
  it("validates and deposits", async () => {
    mockRepo.depositToSavings.mockResolvedValue(makeMockSavings({ balance: 60000n }));
    const result = await depositToSavings("user-1", {
      gameServerId: "server-1",
      amount: "10000",
    });
    expect(result.balance).toBe("60000");
  });

  it("rejects invalid amount", async () => {
    await expect(
      depositToSavings("user-1", { gameServerId: "server-1", amount: "-100" })
    ).rejects.toThrow();
  });
});

describe("withdrawFromSavings", () => {
  it("validates and withdraws", async () => {
    mockRepo.withdrawFromSavings.mockResolvedValue(makeMockSavings({ balance: 40000n }));
    const result = await withdrawFromSavings("user-1", {
      gameServerId: "server-1",
      amount: "10000",
    });
    expect(result.balance).toBe("40000");
  });
});

describe("accrueInterest", () => {
  it("accrues interest on eligible accounts", async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    mockRepo.findAllActiveSavings.mockResolvedValue([
      makeMockSavings({ lastAccrualAt: twoDaysAgo }),
    ]);
    mockRepo.accrueSavingsInterest.mockResolvedValue(makeMockSavings());

    const count = await accrueInterest();
    expect(count).toBe(1);
    expect(mockRepo.accrueSavingsInterest).toHaveBeenCalledOnce();
  });

  it("skips accounts accrued less than 1 day ago", async () => {
    mockRepo.findAllActiveSavings.mockResolvedValue([
      makeMockSavings({ lastAccrualAt: new Date() }),
    ]);

    const count = await accrueInterest();
    expect(count).toBe(0);
    expect(mockRepo.accrueSavingsInterest).not.toHaveBeenCalled();
  });
});

// ── Certificates ─────────────────────────────────────────

describe("openCertificate", () => {
  it("validates and opens a CD", async () => {
    mockRepo.openCertificate.mockResolvedValue(makeMockCertificate());
    const result = await openCertificate("user-1", {
      gameServerId: "server-1",
      principal: "100000",
      termDays: 180,
    });
    expect(result.principal).toBe("100000");
    expect(result.termDays).toBe(180);
  });

  it("rejects invalid term days", async () => {
    await expect(
      openCertificate("user-1", {
        gameServerId: "server-1",
        principal: "100000",
        termDays: 45,
      })
    ).rejects.toThrow();
  });
});

describe("withdrawCertificate", () => {
  it("pays full amount at maturity", async () => {
    const maturedCert = makeMockCertificate({
      maturesAt: new Date("2025-01-01"), // in the past
    });
    mockRepo.findCertificateById.mockResolvedValue(maturedCert);
    mockRepo.withdrawCertificate.mockResolvedValue({
      ...maturedCert,
      status: "withdrawn",
    });

    const result = await withdrawCertificate("cert-1", "user-1");
    expect(result.status).toBe("withdrawn");
    expect(mockRepo.withdrawCertificate).toHaveBeenCalledWith(
      "cert-1",
      "user-1",
      expect.any(BigInt),
      "withdrawn"
    );
  });

  it("applies penalty for early withdrawal", async () => {
    const cert = makeMockCertificate({
      maturesAt: new Date("2027-01-01"), // far future
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    });
    mockRepo.findCertificateById.mockResolvedValue(cert);
    mockRepo.withdrawCertificate.mockResolvedValue({
      ...cert,
      status: "penalty_withdrawn",
    });

    const result = await withdrawCertificate("cert-1", "user-1");
    expect(result.status).toBe("penalty_withdrawn");
    expect(mockRepo.withdrawCertificate).toHaveBeenCalledWith(
      "cert-1",
      "user-1",
      expect.any(BigInt),
      "penalty_withdrawn"
    );
  });

  it("rejects if not found", async () => {
    mockRepo.findCertificateById.mockResolvedValue(null);
    await expect(withdrawCertificate("bad-id", "user-1")).rejects.toThrow("Certificate not found");
  });

  it("rejects if not owner", async () => {
    mockRepo.findCertificateById.mockResolvedValue(makeMockCertificate());
    await expect(withdrawCertificate("cert-1", "other-user")).rejects.toThrow("Not your certificate");
  });

  it("rejects if not active", async () => {
    mockRepo.findCertificateById.mockResolvedValue(
      makeMockCertificate({ status: "withdrawn" })
    );
    await expect(withdrawCertificate("cert-1", "user-1")).rejects.toThrow("Certificate is not active");
  });
});

describe("getMyCertificates", () => {
  it("returns certificate DTOs", async () => {
    mockRepo.findCertificatesByUser.mockResolvedValue([makeMockCertificate()]);
    const result = await getMyCertificates("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("cert-1");
  });
});

describe("matureCertificates", () => {
  it("matures eligible certificates and notifies", async () => {
    mockRepo.findMaturedCertificates.mockResolvedValue([makeMockCertificate()]);
    mockRepo.withdrawCertificate.mockResolvedValue(
      makeMockCertificate({ status: "withdrawn" })
    );

    const count = await matureCertificates();
    expect(count).toBe(1);
    expect(mockRepo.withdrawCertificate).toHaveBeenCalledOnce();
  });
});
