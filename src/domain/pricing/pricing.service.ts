import type { CommodityPriceDTO, PriceHistoryDTO, SetBasePriceInput } from "./pricing.model";
import { setBasePriceSchema } from "./pricing.validator";
import * as pricingRepo from "./pricing.repository";
import { calculatePrice } from "./pricing.engine";

type RepoPrice = Awaited<ReturnType<typeof pricingRepo.findPricesByServer>>[number];

export function toDTO(p: RepoPrice): CommodityPriceDTO {
  return {
    commodityId: p.commodityId,
    commodityName: p.commodityName,
    basePrice: p.basePrice.toString(),
    currentPrice: p.currentPrice.toString(),
    supply: p.supply,
    demand: p.demand,
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function setBasePrice(
  gameServerId: string,
  input: SetBasePriceInput
): Promise<CommodityPriceDTO> {
  const parsed = setBasePriceSchema.parse(input);
  const basePrice = BigInt(parsed.basePrice);
  const currentPrice = calculatePrice(basePrice, 0, 0);

  const price = await pricingRepo.upsertCommodityPrice({
    gameServerId,
    commodityId: parsed.commodityId,
    commodityName: parsed.commodityName,
    basePrice,
    currentPrice,
  });

  return toDTO(price);
}

export async function getPrices(gameServerId: string): Promise<CommodityPriceDTO[]> {
  const prices = await pricingRepo.findPricesByServer(gameServerId);
  return prices.map(toDTO);
}

export async function getPrice(
  gameServerId: string,
  commodityId: string
): Promise<CommodityPriceDTO | null> {
  const price = await pricingRepo.findPrice(gameServerId, commodityId);
  return price ? toDTO(price) : null;
}

export async function getPriceHistory(
  gameServerId: string,
  commodityId: string
): Promise<PriceHistoryDTO[]> {
  const history = await pricingRepo.findPriceHistory(gameServerId, commodityId);
  return history.map((h) => ({
    price: h.price.toString(),
    supply: h.supply,
    demand: h.demand,
    recordedAt: h.recordedAt.toISOString(),
  }));
}

/**
 * Recalculate a commodity's price based on updated supply/demand.
 * Called when marketplace listings or contracts change.
 */
export async function recalculate(
  gameServerId: string,
  commodityId: string,
  supply: number,
  demand: number
): Promise<CommodityPriceDTO | null> {
  const existing = await pricingRepo.findPrice(gameServerId, commodityId);
  if (!existing) return null;

  const newPrice = calculatePrice(existing.basePrice, supply, demand);
  const updated = await pricingRepo.updateSupplyDemand(
    gameServerId,
    commodityId,
    supply,
    demand,
    newPrice
  );

  return toDTO(updated);
}

/**
 * Snapshot all current prices to history.
 * Called periodically by cron.
 */
export async function snapshotPrices(gameServerId: string): Promise<number> {
  const prices = await pricingRepo.findPricesByServer(gameServerId);
  let count = 0;

  for (const p of prices) {
    await pricingRepo.recordPriceHistory({
      gameServerId,
      commodityId: p.commodityId,
      price: p.currentPrice,
      supply: p.supply,
      demand: p.demand,
    });
    count++;
  }

  return count;
}
