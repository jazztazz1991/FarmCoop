import type { BalanceDTO, WalletLedgerEntryDTO } from "./wallet.model";
import { depositSchema, withdrawSchema, transferSchema } from "./wallet.validator";
import * as walletRepo from "./wallet.repository";
import * as farmRepo from "../farm/farm.repository";
import { prisma } from "@/lib/prisma";
import { notify } from "../notification/notification.service";

function ledgerEntryToDTO(entry: {
  id: string;
  amount: bigint;
  type: string;
  description: string;
  createdAt: Date;
}): WalletLedgerEntryDTO {
  return {
    id: entry.id,
    amount: entry.amount.toString(),
    type: entry.type,
    description: entry.description,
    createdAt: entry.createdAt,
  };
}

export async function getBalance(userId: string): Promise<BalanceDTO> {
  const balance = await walletRepo.getBalance(userId);
  return { balance: balance.toString() };
}

/**
 * Deposit: pull money FROM the game INTO the web wallet.
 * Creates a wallet_deposit transaction for the bridge/mod to remove money
 * from the farm. Wallet is NOT credited yet — only when the bridge confirms
 * the game successfully removed the money (see creditDepositOnConfirmation).
 */
export async function deposit(
  userId: string,
  input: { amount: number; farmId: string }
): Promise<{ transactionId: string; amount: number }> {
  const { amount, farmId } = depositSchema.parse(input);

  // Look up the farm to get server and slot info
  const farm = await farmRepo.findFarmById(farmId);
  if (!farm) throw new Error("Farm not found");
  if (farm.userId !== userId) throw new Error("Not your farm");

  // Create a bridge transaction — mod will remove money from the farm
  const tx = await prisma.transaction.create({
    data: {
      type: "wallet_deposit",
      amount,
      senderId: userId,
      recipientFarmId: farm.id,
      gameServerId: farm.gameServerId,
      farmSlot: farm.farmSlot,
    },
  });

  return { transactionId: tx.id, amount };
}

/**
 * Called by the bridge when a wallet_deposit transaction is confirmed.
 * Credits the user's wallet now that the game has removed the money.
 */
export async function creditDepositOnConfirmation(
  userId: string,
  transactionId: string,
  amount: number
): Promise<void> {
  await walletRepo.addLedgerEntry(
    userId,
    BigInt(amount),
    "deposit",
    `Deposit of $${amount} from game`,
    transactionId
  );

  notify({
    userId,
    type: "deposit_confirmed",
    title: "Deposit Confirmed",
    message: `$${amount.toLocaleString()} has been added to your wallet from the game`,
    referenceId: transactionId,
  }).catch(() => {});
}

/**
 * Withdraw: send money FROM the web wallet TO the game farm.
 * Debits wallet immediately, creates a wallet_withdrawal transaction
 * for the bridge/mod to add money to the farm.
 */
export async function withdraw(
  userId: string,
  input: { amount: number; farmId: string }
): Promise<WalletLedgerEntryDTO> {
  const { amount, farmId } = withdrawSchema.parse(input);

  // Look up the farm to get server and slot info
  const farm = await farmRepo.findFarmById(farmId);
  if (!farm) throw new Error("Farm not found");
  if (farm.userId !== userId) throw new Error("Not your farm");

  // Debit wallet first (will throw if insufficient balance)
  const entry = await walletRepo.addLedgerEntry(
    userId,
    BigInt(-amount),
    "withdrawal",
    `Withdrawal of $${amount} to game`
  );

  // Create bridge transaction to add money in-game
  await prisma.transaction.create({
    data: {
      type: "wallet_withdrawal",
      amount,
      senderId: userId,
      recipientFarmId: farm.id,
      gameServerId: farm.gameServerId,
      farmSlot: farm.farmSlot,
    },
  });

  return ledgerEntryToDTO(entry);
}

export async function transfer(
  fromUserId: string,
  input: { toUserId: string; amount: number; description?: string }
): Promise<void> {
  const { toUserId, amount, description } = transferSchema.parse(input);

  if (fromUserId === toUserId) throw new Error("Cannot transfer to yourself");

  const desc = description || `Transfer of $${amount}`;

  // Debit sender
  await walletRepo.addLedgerEntry(
    fromUserId,
    BigInt(-amount),
    "transfer_out",
    desc
  );

  // Credit receiver
  await walletRepo.addLedgerEntry(
    toUserId,
    BigInt(amount),
    "transfer_in",
    desc
  );

  notify({
    userId: toUserId,
    type: "transfer_received",
    title: "Transfer Received",
    message: `You received $${amount.toLocaleString()}`,
  }).catch(() => {});
}

export async function getLedger(
  userId: string,
  limit = 50
): Promise<WalletLedgerEntryDTO[]> {
  const entries = await walletRepo.getLedgerEntries(userId, limit);
  return entries.map(ledgerEntryToDTO);
}
