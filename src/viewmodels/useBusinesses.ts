"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/fetch";

interface Business {
  id: string;
  ownerId: string;
  ownerName: string;
  gameServerId: string;
  serverName: string;
  type: string;
  name: string;
  description: string;
  status: string;
  settings: Record<string, unknown>;
  createdAt: string;
}

interface LedgerEntry {
  id: string;
  amount: string;
  type: string;
  description: string;
  createdAt: string;
}

interface BusinessWallet {
  balance: string;
  ledger: LedgerEntry[];
}

interface BusinessesState {
  businesses: Business[];
  myBusinesses: Business[];
  loading: boolean;
  error: string | null;
}

export function useBusinesses(filters?: { type?: string; serverId?: string }) {
  const [state, setState] = useState<BusinessesState>({
    businesses: [],
    myBusinesses: [],
    loading: true,
    error: null,
  });

  const fetchBusinesses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.set("type", filters.type);
      if (filters?.serverId) params.set("serverId", filters.serverId);
      const qs = params.toString();

      const res = await fetch(`/api/businesses${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to load businesses");
      const businesses: Business[] = await res.json();

      setState((prev) => ({ ...prev, businesses, loading: false, error: null }));
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load businesses",
      }));
    }
  }, [filters?.type, filters?.serverId]);

  const fetchMyBusinesses = useCallback(async () => {
    try {
      const res = await fetch("/api/businesses/mine");
      if (!res.ok) throw new Error("Failed to load your businesses");
      const myBusinesses: Business[] = await res.json();

      setState((prev) => ({ ...prev, myBusinesses, loading: false, error: null }));
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load your businesses",
      }));
    }
  }, []);

  useEffect(() => {
    const load = () => { fetchBusinesses(); };
    load();
  }, [fetchBusinesses]);

  return { ...state, fetchBusinesses, fetchMyBusinesses };
}

export function useBusiness(id: string) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [wallet, setWallet] = useState<BusinessWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [bizRes, walletRes] = await Promise.all([
        fetch(`/api/businesses/${id}`),
        fetch(`/api/businesses/${id}/wallet`),
      ]);

      if (!bizRes.ok) throw new Error("Business not found");
      const biz: Business = await bizRes.json();
      setBusiness(biz);

      if (walletRes.ok) {
        const w: BusinessWallet = await walletRes.json();
        setWallet(w);
      }

      setError(null);
    } catch {
      setError("Failed to load business");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const load = () => { refresh(); };
    load();
  }, [refresh]);

  const deposit = async (amount: string) => {
    const res = await apiFetch(`/api/businesses/${id}/wallet/deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Deposit failed");
    }
    await refresh();
  };

  const withdraw = async (amount: string) => {
    const res = await apiFetch(`/api/businesses/${id}/wallet/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Withdrawal failed");
    }
    await refresh();
  };

  return { business, wallet, loading, error, refresh, deposit, withdraw };
}
