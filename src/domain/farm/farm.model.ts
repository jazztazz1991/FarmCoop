export interface FarmDTO {
  id: string;
  gameServerId: string;
  userId: string;
  farmSlot: number;
  name: string;
  createdAt: Date;
}

export interface ClaimFarmInput {
  gameServerId: string;
  farmSlot: number;
  name: string;
}
