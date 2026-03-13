/**
 * Pure supply/demand pricing formula.
 *
 * currentPrice = basePrice * (1 + dampingFactor * (demand - supply) / (demand + supply + 1))
 *
 * - When demand > supply, price rises above base
 * - When supply > demand, price falls below base
 * - Floor: 10% of base price
 * - Cap: 300% of base price
 */

const PRICE_FLOOR_PCT = 10n;   // 10% of base
const PRICE_CAP_PCT = 300n;    // 300% of base

export function calculatePrice(
  basePrice: bigint,
  supply: number,
  demand: number
): bigint {
  if (basePrice <= 0n) return 0n;

  const total = supply + demand + 1;
  const diff = demand - supply;

  // Use integer arithmetic: basePrice * (total + dampingFactor * diff) / total
  // dampingFactor = 0.5 = 1/2, so: basePrice * (2*total + diff) / (2*total)
  const numerator = basePrice * BigInt(2 * total + diff);
  const denominator = BigInt(2 * total);

  let price = numerator / denominator;

  // Apply floor and cap
  const floor = (basePrice * PRICE_FLOOR_PCT) / 100n;
  const cap = (basePrice * PRICE_CAP_PCT) / 100n;

  if (price < floor) price = floor;
  if (price > cap) price = cap;

  return price;
}
