export type ListingType = "equipment" | "commodity";
export type ListingStatus = "active" | "sold" | "cancelled" | "expired";

export interface Listing {
  id: string;
  sellerId: string;
  buyerId: string | null;
  type: ListingType;
  itemId: string;
  itemName: string;
  quantity: number;
  pricePerUnit: bigint;
  status: ListingStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingDTO {
  id: string;
  sellerId: string;
  sellerName: string;
  type: ListingType;
  itemId: string;
  itemName: string;
  quantity: number;
  pricePerUnit: string;
  totalPrice: string;
  status: ListingStatus;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateListingInput {
  type: ListingType;
  itemId: string;
  itemName: string;
  quantity: number;
  pricePerUnit: number;
}
