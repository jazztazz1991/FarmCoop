import { describe, it, expect } from "vitest";
import { calculatePrice } from "../pricing.engine";

describe("calculatePrice", () => {
  const BASE = 1000n;

  it("returns base price when supply and demand are equal", () => {
    expect(calculatePrice(BASE, 10, 10)).toBe(1000n);
  });

  it("returns base price when supply and demand are both zero", () => {
    // (2*1 + 0) / (2*1) = 1 → basePrice
    expect(calculatePrice(BASE, 0, 0)).toBe(1000n);
  });

  it("returns 0 when base price is 0", () => {
    expect(calculatePrice(0n, 5, 10)).toBe(0n);
  });

  it("returns 0 when base price is negative", () => {
    expect(calculatePrice(-100n, 5, 10)).toBe(0n);
  });

  it("increases price when demand exceeds supply", () => {
    const price = calculatePrice(BASE, 0, 10);
    expect(price).toBeGreaterThan(BASE);
  });

  it("decreases price when supply exceeds demand", () => {
    const price = calculatePrice(BASE, 10, 0);
    expect(price).toBeLessThan(BASE);
  });

  it("never drops below floor (10% of base) even with extreme supply", () => {
    // With damping=0.5, formula asymptotes to ~50% of base, above the 10% floor
    // But floor still protects: verify price >= floor
    const price = calculatePrice(BASE, 100000, 0);
    const floor = (BASE * 10n) / 100n; // 100n
    expect(price).toBeGreaterThanOrEqual(floor);
    // With extreme supply, price approaches 500 (half of base)
    expect(price).toBe(500n);
  });

  it("never exceeds cap (300% of base) even with extreme demand", () => {
    // With damping=0.5, formula asymptotes to ~150% of base, below the 300% cap
    // But cap still protects: verify price <= cap
    const price = calculatePrice(BASE, 0, 100000);
    const cap = (BASE * 300n) / 100n; // 3000n
    expect(price).toBeLessThanOrEqual(cap);
    // With extreme demand, price approaches 1500 (150% of base)
    expect(price).toBe(1499n);
  });

  it("price scales proportionally with demand increase", () => {
    const low = calculatePrice(BASE, 5, 10);
    const high = calculatePrice(BASE, 5, 20);
    expect(high).toBeGreaterThan(low);
  });

  it("price scales proportionally with supply increase", () => {
    const low = calculatePrice(BASE, 10, 5);
    const high = calculatePrice(BASE, 20, 5);
    expect(high).toBeLessThan(low);
  });

  it("handles large base prices", () => {
    const largeBase = 1_000_000_000n;
    const price = calculatePrice(largeBase, 50, 100);
    expect(price).toBeGreaterThan(largeBase);
    expect(price).toBeLessThanOrEqual(largeBase * 3n);
  });

  it("symmetric: equal opposite shifts produce symmetric results around base", () => {
    const highDemand = calculatePrice(BASE, 0, 10);
    const highSupply = calculatePrice(BASE, 10, 0);
    // highDemand - BASE should roughly equal BASE - highSupply
    const above = highDemand - BASE;
    const below = BASE - highSupply;
    // They won't be exactly equal due to integer division, but should be close
    expect(Number(above)).toBeCloseTo(Number(below), -1);
  });

  it("calculates correct value for known inputs", () => {
    // supply=5, demand=15, total=21, diff=10
    // numerator = 1000 * (2*21 + 10) = 1000 * 52 = 52000
    // denominator = 2 * 21 = 42
    // price = 52000 / 42 = 1238 (integer division)
    expect(calculatePrice(BASE, 5, 15)).toBe(1238n);
  });
});
