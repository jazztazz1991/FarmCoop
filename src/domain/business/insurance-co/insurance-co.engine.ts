// Re-exports shared insurance calculations
export { calculatePremium, calculateGeneralPayout, RISK_RATES } from "@/domain/insurance/insurance.engine";

/**
 * Get custom risk rate for a policy type from business settings,
 * falling back to system default rates.
 */
export function getCustomRiskRate(
  settings: Record<string, unknown>,
  policyType: string
): number {
  const rates = settings?.riskRates;
  if (rates && typeof rates === "object" && !Array.isArray(rates)) {
    const custom = (rates as Record<string, unknown>)[policyType];
    if (typeof custom === "number" && custom >= 0 && custom <= 10000) return custom;
  }
  // Fall back to system defaults
  const defaults: Record<string, number> = { crop: 300, vehicle: 500, liability: 200 };
  return defaults[policyType] ?? 300;
}

/**
 * Suggest a payout amount for a claim (non-binding helper for the owner).
 */
export function suggestPayout(
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
