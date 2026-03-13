/**
 * Pure BigInt arithmetic for banking calculations.
 * No floating point — all amounts in integer units (e.g. cents or game currency).
 */

/**
 * Calculate fixed monthly payment for an amortized loan.
 *
 * Uses the standard amortization formula approximated in integer math:
 *   payment = P * r * (1+r)^n / ((1+r)^n - 1)
 *
 * Where r = annual rate (basis points) / 12 / 10000
 * For BigInt: scale numerator/denominator by 10^12 to preserve precision.
 */
const SCALE = 1000000000000n; // 10^12 for intermediate precision

export function calculateMonthlyPayment(
  principal: bigint,
  rateBasisPoints: number,
  termMonths: number
): bigint {
  if (principal <= 0n) return 0n;
  if (termMonths <= 0) return principal;

  if (rateBasisPoints === 0) {
    // No interest — simple division
    return principal / BigInt(termMonths);
  }

  // Monthly rate as scaled bigint: rateBasisPoints / 12 / 10000 * SCALE
  const monthlyRateScaled = (BigInt(rateBasisPoints) * SCALE) / 120000n;

  // Compute (1 + r)^n using scaled arithmetic
  let compoundFactor = SCALE; // starts at 1.0 scaled
  for (let i = 0; i < termMonths; i++) {
    compoundFactor = (compoundFactor * (SCALE + monthlyRateScaled)) / SCALE;
  }

  // payment = P * r * (1+r)^n / ((1+r)^n - 1)
  const numerator = principal * monthlyRateScaled * compoundFactor;
  const denominator = (compoundFactor - SCALE) * SCALE;

  return numerator / denominator;
}

/**
 * Calculate simple daily interest accrual.
 *
 * interest = balance * apyBasisPoints * days / (10000 * 365)
 */
export function calculateInterestAccrual(
  balance: bigint,
  apyBasisPoints: number,
  days: number
): bigint {
  if (balance <= 0n || apyBasisPoints <= 0 || days <= 0) return 0n;
  return (balance * BigInt(apyBasisPoints) * BigInt(days)) / (10000n * 365n);
}

/**
 * Calculate CD payout at maturity.
 *
 * payout = principal + (principal * apyBasisPoints * termDays / (10000 * 365))
 */
export function calculateCDPayout(
  principal: bigint,
  apyBasisPoints: number,
  termDays: number
): bigint {
  if (principal <= 0n) return 0n;
  const interest = calculateInterestAccrual(principal, apyBasisPoints, termDays);
  return principal + interest;
}

/**
 * Calculate early withdrawal penalty for a CD.
 *
 * Standard penalty: 90 days of interest, capped at earned interest.
 * If held for full term or more, no penalty.
 */
const PENALTY_DAYS = 90;

export function calculateEarlyWithdrawalPenalty(
  principal: bigint,
  apyBasisPoints: number,
  daysHeld: number,
  termDays: number
): bigint {
  if (principal <= 0n || daysHeld >= termDays) return 0n;

  const penaltyAmount = calculateInterestAccrual(principal, apyBasisPoints, PENALTY_DAYS);
  const earnedInterest = calculateInterestAccrual(principal, apyBasisPoints, daysHeld);

  // Cap penalty at what was actually earned
  return penaltyAmount < earnedInterest ? penaltyAmount : earnedInterest;
}
