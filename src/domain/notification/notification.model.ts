export type NotificationType =
  | "listing_sold"
  | "listing_purchased"
  | "deposit_confirmed"
  | "withdrawal_sent"
  | "transfer_received"
  | "contract_claimed"
  | "contract_delivered"
  | "contract_completed"
  | "contract_cancelled"
  | "loan_approved"
  | "loan_payment_due"
  | "loan_defaulted"
  | "cd_matured"
  | "policy_purchased"
  | "claim_approved"
  | "claim_denied"
  | "production_completed"
  | "production_collected"
  | "factory_created";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string | null;
  read: boolean;
  createdAt: Date;
}

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
}
