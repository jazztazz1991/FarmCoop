"use client";

import { useEffect, useState, useCallback } from "react";

interface Transaction {
  id: string;
  type: string;
  amount: number | null;
  equipmentId: string | null;
  status: string;
  farmSlot: number;
  createdAt: string;
}

export function useTransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        setTransactions(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { transactions, loading, refresh };
}
