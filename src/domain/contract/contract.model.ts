export interface ContractDTO {
  id: string;
  gameServerId: string;
  posterId: string;
  posterName: string;
  claimerId: string | null;
  claimerName: string | null;
  commodityId: string;
  commodityName: string;
  quantity: number;
  pricePerUnit: string;
  totalPayout: string;
  status: string;
  expiresAt: string;
  deliveryDeadline: string | null;
  claimedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CreateContractInput {
  gameServerId: string;
  commodityId: string;
  commodityName: string;
  quantity: number;
  pricePerUnit: number;
  expiresAt: string; // ISO date string
}
