// Re-exports the shared banking calculation — no duplication
export { calculateMonthlyPayment } from "@/domain/banking/banking.engine";

/**
 * Get the interest rate for a bank from its settings, falling back to default.
 */
export function getInterestRate(settings: Record<string, unknown>): number {
  const rate = settings?.interestRateBp;
  if (typeof rate === "number" && rate >= 0 && rate <= 10000) return rate;
  return 500; // default 5%
}

/**
 * Get the max loan amount for a bank from its settings.
 */
export function getMaxLoanAmount(settings: Record<string, unknown>): bigint {
  const max = settings?.maxLoanAmount;
  if (typeof max === "string") {
    try {
      const val = BigInt(max);
      if (val > 0n) return val;
    } catch {
      // fall through
    }
  }
  return 1000000n; // default
}

/**
 * Check if a loan application is within the bank's limits.
 */
export function isLoanWithinLimits(
  principal: bigint,
  maxLoanAmount: bigint
): boolean {
  return principal > 0n && principal <= maxLoanAmount;
}
