/**
 * Pure BigInt arithmetic for insurance calculations.
 */

/**
 * Calculate insurance premium.
 *
 * premium = coverageAmount * riskBasisPoints * termDays / (10000 * 365)
 *
 * riskBasisPoints varies by type:
 * - crop: 300 (3% annual)
 * - vehicle: 500 (5% annual)
 * - liability: 200 (2% annual)
 */
export function calculatePremium(
  coverageAmount: bigint,
  riskBasisPoints: number,
  termDays: number
): bigint {
  if (coverageAmount <= 0n || riskBasisPoints <= 0 || termDays <= 0) return 0n;
  return (coverageAmount * BigInt(riskBasisPoints) * BigInt(termDays)) / (10000n * 365n);
}

/**
 * Calculate crop insurance payout.
 *
 * If current price < strike price:
 *   payout = (strikePrice - currentPrice) * quantity - deductible
 * Else: 0
 *
 * Capped at coverageAmount.
 */
export function calculateCropPayout(
  strikePrice: bigint,
  currentPrice: bigint,
  quantity: number,
  deductible: bigint,
  coverageAmount: bigint
): bigint {
  if (currentPrice >= strikePrice) return 0n;

  const loss = (strikePrice - currentPrice) * BigInt(quantity);
  let payout = loss - deductible;
  if (payout < 0n) payout = 0n;
  if (payout > coverageAmount) payout = coverageAmount;
  return payout;
}

/**
 * Calculate vehicle/liability insurance payout.
 *
 * payout = claimAmount - deductible, capped at coverageAmount.
 */
export function calculateGeneralPayout(
  claimAmount: bigint,
  deductible: bigint,
  coverageAmount: bigint
): bigint {
  if (claimAmount <= 0n) return 0n;
  let payout = claimAmount - deductible;
  if (payout < 0n) payout = 0n;
  if (payout > coverageAmount) payout = coverageAmount;
  return payout;
}

/** Risk basis points by insurance type */
export const RISK_RATES: Record<string, number> = {
  crop: 300,
  vehicle: 500,
  liability: 200,
};
