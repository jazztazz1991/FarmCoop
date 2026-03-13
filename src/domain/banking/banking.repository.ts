import { prisma } from "@/lib/prisma";

const loanSelect = {
  id: true,
  borrowerId: true,
  gameServerId: true,
  principal: true,
  interestRate: true,
  remainingBalance: true,
  monthlyPayment: true,
  termMonths: true,
  paymentsRemaining: true,
  status: true,
  nextPaymentDue: true,
  disbursedAt: true,
  paidOffAt: true,
  createdAt: true,
} as const;

const savingsSelect = {
  id: true,
  userId: true,
  gameServerId: true,
  balance: true,
  apyBasisPoints: true,
  lastAccrualAt: true,
  createdAt: true,
} as const;

const certificateSelect = {
  id: true,
  userId: true,
  gameServerId: true,
  principal: true,
  apyBasisPoints: true,
  termDays: true,
  maturesAt: true,
  status: true,
  createdAt: true,
} as const;

// ── Loans ────────────────────────────────────────────────

/** Atomically disburse a loan: credit wallet + create loan + ledger entry */
export async function disburseLoan(data: {
  borrowerId: string;
  gameServerId: string;
  principal: bigint;
  interestRate: number;
  remainingBalance: bigint;
  monthlyPayment: bigint;
  termMonths: number;
  nextPaymentDue: Date;
}) {
  return prisma.$transaction(async (tx) => {
    // Credit borrower's wallet
    const wallet = await tx.wallet.upsert({
      where: { userId: data.borrowerId },
      create: { userId: data.borrowerId },
      update: {},
      select: { id: true, balance: true },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance + data.principal },
    });

    // Create loan
    const loan = await tx.loan.create({
      data: {
        borrowerId: data.borrowerId,
        gameServerId: data.gameServerId,
        principal: data.principal,
        interestRate: data.interestRate,
        remainingBalance: data.remainingBalance,
        monthlyPayment: data.monthlyPayment,
        termMonths: data.termMonths,
        paymentsRemaining: data.termMonths,
        nextPaymentDue: data.nextPaymentDue,
      },
      select: loanSelect,
    });

    // Ledger entry
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: data.principal,
        type: "loan_disbursement",
        description: `Loan disbursed: ${data.principal.toString()}`,
        referenceId: loan.id,
      },
    });

    return loan;
  });
}

/** Atomically make a loan payment: debit wallet + reduce balance + ledger entry */
export async function makeLoanPayment(
  loanId: string,
  borrowerId: string,
  paymentAmount: bigint,
  newRemainingBalance: bigint,
  newPaymentsRemaining: number,
  nextPaymentDue: Date | null
) {
  return prisma.$transaction(async (tx) => {
    // Debit borrower's wallet
    const wallet = await tx.wallet.findUniqueOrThrow({
      where: { userId: borrowerId },
      select: { id: true, balance: true },
    });

    if (wallet.balance < paymentAmount) {
      throw new Error("Insufficient balance for loan payment");
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance - paymentAmount },
    });

    // Update loan
    const isPaidOff = newPaymentsRemaining <= 0 || newRemainingBalance <= 0n;
    const loan = await tx.loan.update({
      where: { id: loanId },
      data: {
        remainingBalance: isPaidOff ? 0n : newRemainingBalance,
        paymentsRemaining: isPaidOff ? 0 : newPaymentsRemaining,
        status: isPaidOff ? "paid_off" : "active",
        nextPaymentDue: isPaidOff ? undefined : nextPaymentDue!,
        paidOffAt: isPaidOff ? new Date() : undefined,
      },
      select: loanSelect,
    });

    // Ledger entry
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: -paymentAmount,
        type: "loan_payment",
        description: `Loan payment: ${paymentAmount.toString()}`,
        referenceId: loanId,
      },
    });

    return loan;
  });
}

export async function findLoansByBorrower(borrowerId: string) {
  return prisma.loan.findMany({
    where: { borrowerId },
    select: loanSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findLoanById(id: string) {
  return prisma.loan.findUnique({
    where: { id },
    select: loanSelect,
  });
}

export async function findActiveLoans(borrowerId: string) {
  return prisma.loan.findMany({
    where: { borrowerId, status: "active" },
    select: loanSelect,
  });
}

export async function findOverdueLoans() {
  return prisma.loan.findMany({
    where: {
      status: "active",
      nextPaymentDue: { lt: new Date() },
    },
    select: loanSelect,
  });
}

export async function defaultLoan(loanId: string) {
  return prisma.loan.update({
    where: { id: loanId },
    data: { status: "defaulted" },
    select: loanSelect,
  });
}

// ── Savings ──────────────────────────────────────────────

export async function findOrCreateSavings(userId: string, gameServerId: string) {
  return prisma.savingsAccount.upsert({
    where: { userId_gameServerId: { userId, gameServerId } },
    create: { userId, gameServerId },
    update: {},
    select: savingsSelect,
  });
}

/** Atomically deposit into savings: debit wallet + credit savings + ledger */
export async function depositToSavings(
  userId: string,
  gameServerId: string,
  amount: bigint
) {
  return prisma.$transaction(async (tx) => {
    // Debit wallet
    const wallet = await tx.wallet.findUniqueOrThrow({
      where: { userId },
      select: { id: true, balance: true },
    });

    if (wallet.balance < amount) {
      throw new Error("Insufficient balance");
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance - amount },
    });

    // Credit savings
    const savings = await tx.savingsAccount.upsert({
      where: { userId_gameServerId: { userId, gameServerId } },
      create: { userId, gameServerId, balance: amount },
      update: { balance: { increment: amount } },
      select: savingsSelect,
    });

    // Ledger entry
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        type: "savings_deposit",
        description: `Deposited ${amount.toString()} to savings`,
        referenceId: savings.id,
      },
    });

    return savings;
  });
}

/** Atomically withdraw from savings: debit savings + credit wallet + ledger */
export async function withdrawFromSavings(
  userId: string,
  gameServerId: string,
  amount: bigint
) {
  return prisma.$transaction(async (tx) => {
    const savings = await tx.savingsAccount.findUnique({
      where: { userId_gameServerId: { userId, gameServerId } },
      select: { id: true, balance: true },
    });

    if (!savings || savings.balance < amount) {
      throw new Error("Insufficient savings balance");
    }

    await tx.savingsAccount.update({
      where: { id: savings.id },
      data: { balance: savings.balance - amount },
    });

    // Credit wallet
    const wallet = await tx.wallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true, balance: true },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance + amount },
    });

    // Ledger entry
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount,
        type: "savings_withdrawal",
        description: `Withdrew ${amount.toString()} from savings`,
        referenceId: savings.id,
      },
    });

    return tx.savingsAccount.findUniqueOrThrow({
      where: { id: savings.id },
      select: savingsSelect,
    });
  });
}

/** Accrue interest on a single savings account */
export async function accrueSavingsInterest(
  savingsId: string,
  interest: bigint
) {
  return prisma.savingsAccount.update({
    where: { id: savingsId },
    data: {
      balance: { increment: interest },
      lastAccrualAt: new Date(),
    },
    select: savingsSelect,
  });
}

export async function findAllActiveSavings() {
  return prisma.savingsAccount.findMany({
    where: { balance: { gt: 0 } },
    select: savingsSelect,
  });
}

// ── Certificates ─────────────────────────────────────────

/** Atomically open CD: debit wallet + create certificate + ledger */
export async function openCertificate(data: {
  userId: string;
  gameServerId: string;
  principal: bigint;
  apyBasisPoints: number;
  termDays: number;
  maturesAt: Date;
}) {
  return prisma.$transaction(async (tx) => {
    // Debit wallet
    const wallet = await tx.wallet.findUniqueOrThrow({
      where: { userId: data.userId },
      select: { id: true, balance: true },
    });

    if (wallet.balance < data.principal) {
      throw new Error("Insufficient balance");
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance - data.principal },
    });

    // Create certificate
    const cert = await tx.certificate.create({
      data: {
        userId: data.userId,
        gameServerId: data.gameServerId,
        principal: data.principal,
        apyBasisPoints: data.apyBasisPoints,
        termDays: data.termDays,
        maturesAt: data.maturesAt,
      },
      select: certificateSelect,
    });

    // Ledger entry
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: -data.principal,
        type: "cd_deposit",
        description: `Opened ${data.termDays}-day CD: ${data.principal.toString()}`,
        referenceId: cert.id,
      },
    });

    return cert;
  });
}

/** Atomically withdraw CD at maturity: credit wallet + update cert + ledger */
export async function withdrawCertificate(
  certId: string,
  userId: string,
  payout: bigint,
  status: "withdrawn" | "penalty_withdrawn"
) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true, balance: true },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance + payout },
    });

    const cert = await tx.certificate.update({
      where: { id: certId },
      data: { status },
      select: certificateSelect,
    });

    const ledgerType = status === "withdrawn" ? "cd_maturity" : "cd_early_withdrawal";
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: payout,
        type: ledgerType,
        description: `CD ${status === "withdrawn" ? "matured" : "early withdrawal"}: ${payout.toString()}`,
        referenceId: certId,
      },
    });

    return cert;
  });
}

export async function findCertificatesByUser(userId: string) {
  return prisma.certificate.findMany({
    where: { userId },
    select: certificateSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findCertificateById(id: string) {
  return prisma.certificate.findUnique({
    where: { id },
    select: certificateSelect,
  });
}

export async function findMaturedCertificates() {
  return prisma.certificate.findMany({
    where: {
      status: "active",
      maturesAt: { lte: new Date() },
    },
    select: certificateSelect,
  });
}
