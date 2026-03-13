"use client";

import { useEffect, useState, useCallback } from "react";

interface Farm {
  id: string;
  name: string;
  farmSlot: number;
  serverName: string;
  gameServerId: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number | null;
  equipmentId: string | null;
  status: string;
  farmSlot: number;
  createdAt: string;
}

interface DashboardState {
  balance: string;
  farms: Farm[];
  recentTransactions: Transaction[];
  loading: boolean;
  error: string | null;
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    balance: "0",
    farms: [],
    recentTransactions: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const [walletRes, farmsRes, txRes] = await Promise.all([
        fetch("/api/wallet"),
        fetch("/api/farms/mine"),
        fetch("/api/transactions?limit=5"),
      ]);

      const balance = walletRes.ok
        ? (await walletRes.json()).balance
        : "0";

      const farms = farmsRes.ok ? await farmsRes.json() : [];
      const recentTransactions = txRes.ok ? await txRes.json() : [];

      setState({
        balance,
        farms,
        recentTransactions,
        loading: false,
        error: null,
      });
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load dashboard data",
      }));
    }
  }, []);

  useEffect(() => {
    const load = () => { refresh(); };
    load();
  }, [refresh]);

  return { ...state, refresh };
}
