export interface DealershipListingDTO {
  id: string;
  businessId: string;
  businessName: string;
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
  pricePerUnit: string;
  status: string;
  createdAt: string;
}

export interface DealershipSettings {
  markup: number; // percentage markup on cost basis
}

export interface AddInventoryInput {
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
  pricePerUnit: string;
}

export interface PurchaseInput {
  recipientFarmId: string;
}
