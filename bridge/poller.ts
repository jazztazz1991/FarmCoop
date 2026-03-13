import type { BridgeConfig, ServerConfig } from "./bridge.config";

export interface PendingTransaction {
  id: string;
  type: "money" | "equipment" | "wallet_deposit" | "wallet_withdrawal";
  farmId: number;
  gameServerId: string;
  amount: number | null;
  equipmentId: string | null;
  senderId?: string;
}

export async function fetchActiveServers(
  config: BridgeConfig
): Promise<ServerConfig[]> {
  const url = `${config.apiBaseUrl}/api/servers/active`;
  const res = await fetch(url, {
    headers: { "x-api-key": config.apiKey },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch active servers: ${res.status}`);
  }

  return res.json();
}

export async function fetchPendingTransactions(
  config: BridgeConfig
): Promise<PendingTransaction[]> {
  const url = `${config.apiBaseUrl}/api/transactions?status=pending`;
  const res = await fetch(url, {
    headers: { "x-api-key": config.apiKey },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch pending transactions: ${res.status}`);
  }

  return res.json();
}

/** Group transactions by gameServerId */
export function groupByServer(
  transactions: PendingTransaction[]
): Map<string, PendingTransaction[]> {
  const groups = new Map<string, PendingTransaction[]>();
  for (const tx of transactions) {
    const list = groups.get(tx.gameServerId) || [];
    list.push(tx);
    groups.set(tx.gameServerId, list);
  }
  return groups;
}

export async function creditWalletDeposit(
  config: BridgeConfig,
  userId: string,
  transactionId: string,
  amount: number
): Promise<void> {
  const url = `${config.apiBaseUrl}/api/wallet/credit`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
    },
    body: JSON.stringify({ userId, transactionId, amount }),
  });

  if (!res.ok) {
    throw new Error(`Failed to credit wallet for tx ${transactionId}: ${res.status}`);
  }
}

export async function updateTransactionStatus(
  config: BridgeConfig,
  id: string,
  status: "delivered" | "confirmed" | "failed"
): Promise<void> {
  const url = `${config.apiBaseUrl}/api/transactions/${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to update transaction ${id} to ${status}: ${res.status}`
    );
  }
}
