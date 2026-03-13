export interface CommodityPriceDTO {
  commodityId: string;
  commodityName: string;
  basePrice: string;
  currentPrice: string;
  supply: number;
  demand: number;
  updatedAt: string;
}

export interface PriceHistoryDTO {
  price: string;
  supply: number;
  demand: number;
  recordedAt: string;
}

export interface SetBasePriceInput {
  commodityId: string;
  commodityName: string;
  basePrice: number;
}
