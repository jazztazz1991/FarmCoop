export interface DeliveryContractDTO {
  id: string;
  businessId: string;
  businessName: string;
  posterId: string;
  posterName: string;
  serverName: string;
  farmName: string;
  farmSlot: number;
  itemDescription: string;
  payout: string;
  status: string;
  acceptedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface PostDeliveryInput {
  destinationFarmId: string;
  itemDescription: string;
  payout: string;
}
