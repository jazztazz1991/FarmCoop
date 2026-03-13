export type TransactionType = "money" | "equipment" | "wallet_deposit" | "wallet_withdrawal";

export type TransactionStatus =
  | "pending"
  | "delivered"
  | "confirmed"
  | "failed";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number | null;
  equipmentId: string | null;
  status: TransactionStatus;
  senderId: string;
  recipientFarmId: string;
  gameServerId: string;
  farmSlot: number;
  createdAt: Date;
  updatedAt: Date;
  bridgePickedUpAt: Date | null;
  deliveredAt: Date | null;
  confirmedAt: Date | null;
}

export interface CreateTransactionInput {
  type: TransactionType;
  recipientFarmId: string;
  gameServerId: string;
  farmSlot: number;
  senderId: string;
  amount?: number;
  equipmentId?: string;
}

/** DTO returned to API consumers (bridge + dashboard) */
export interface TransactionDTO {
  id: string;
  type: TransactionType;
  farmId: number; // farmSlot — what the mod/bridge needs
  gameServerId: string;
  amount: number | null;
  equipmentId: string | null;
  status: TransactionStatus;
  senderId: string;
  createdAt: string;
}
