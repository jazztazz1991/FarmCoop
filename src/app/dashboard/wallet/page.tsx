"use client";

import { useEffect, useState } from "react";
import WalletCard from "@/components/dashboard/WalletCard";

interface Farm {
  id: string;
  name: string;
  farmSlot: number;
  serverName?: string;
}

interface LedgerEntry {
  id: string;
  amount: string;
  type: string;
  description: string;
  createdAt: string;
}

interface PendingTx {
  id: string;
  type: string;
  amount: number | null;
  status: string;
  createdAt: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState("0");
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [pendingTxs, setPendingTxs] = useState<PendingTx[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDepositFarm, setSelectedDepositFarm] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedWithdrawFarm, setSelectedWithdrawFarm] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refresh = async () => {
    const [balRes, ledgerRes, farmsRes, pendingRes] = await Promise.all([
      fetch("/api/wallet"),
      fetch("/api/wallet/ledger"),
      fetch("/api/farms/mine"),
      fetch("/api/wallet/pending"),
    ]);
    if (balRes.ok) setBalance((await balRes.json()).balance);
    if (ledgerRes.ok) setLedger(await ledgerRes.json());
    if (farmsRes.ok) setFarms(await farmsRes.json());
    if (pendingRes.ok) setPendingTxs(await pendingRes.json());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDeposit = async () => {
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(depositAmount),
          farmId: selectedDepositFarm,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to deposit");
      }

      setDepositAmount("");
      setSelectedDepositFarm("");
      setSuccess(
        `Deposit of $${Number(depositAmount).toLocaleString()} initiated. Money will be removed from your farm and credited to your wallet once confirmed.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(withdrawAmount),
          farmId: selectedWithdrawFarm,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to withdraw");
      }

      setWithdrawAmount("");
      setSelectedWithdrawFarm("");
      setSuccess(
        `Withdrawal of $${Number(withdrawAmount).toLocaleString()} sent to your farm.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading wallet...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Wallet</h2>

      <div className="max-w-sm">
        <WalletCard balance={balance} />
      </div>

      {farms.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl text-center">
          <p className="text-gray-400 mb-2">
            You need to claim a farm before you can deposit or withdraw.
          </p>
          <a
            href="/dashboard/farms"
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Go to My Farms
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-white mb-3">
              Deposit (Game → Wallet)
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Removes money from your in-game farm and adds it to your wallet.
            </p>
            <div className="space-y-2">
              <select
                value={selectedDepositFarm}
                onChange={(e) => setSelectedDepositFarm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select farm...</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} (Slot {f.farmSlot})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleDeposit}
                  disabled={
                    actionLoading || !depositAmount || !selectedDepositFarm
                  }
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Deposit
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-white mb-3">
              Withdraw (Wallet → Game)
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Sends money from your wallet to your in-game farm.
            </p>
            <div className="space-y-2">
              <select
                value={selectedWithdrawFarm}
                onChange={(e) => setSelectedWithdrawFarm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select farm...</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} (Slot {f.farmSlot})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleWithdraw}
                  disabled={
                    actionLoading || !withdrawAmount || !selectedWithdrawFarm
                  }
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-2 rounded text-sm max-w-2xl">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded text-sm max-w-2xl">
          {error}
        </div>
      )}

      {pendingTxs.length > 0 && (
        <div className="max-w-2xl">
          <h3 className="text-lg font-semibold text-white mb-3">
            Pending Transactions
          </h3>
          <div className="space-y-2">
            {pendingTxs.map((tx) => (
              <div
                key={tx.id}
                className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm text-yellow-300 font-medium">
                    {tx.type === "wallet_deposit"
                      ? "Deposit from game"
                      : "Withdrawal to game"}
                  </span>
                  <span className="text-sm text-gray-400 ml-2">
                    ${tx.amount?.toLocaleString() ?? "—"}
                  </span>
                </div>
                <span className="text-xs text-yellow-400 capitalize">
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Ledger</h3>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {ledger.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No ledger entries yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => {
                  const isCredit = Number(entry.amount) > 0;
                  return (
                    <tr
                      key={entry.id}
                      className="border-b border-gray-800/50"
                    >
                      <td className="p-4 text-gray-300 capitalize">
                        {entry.type.replace("_", " ")}
                      </td>
                      <td
                        className={`p-4 font-medium ${
                          isCredit ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {isCredit ? "+" : ""}
                        ${Number(entry.amount).toLocaleString()}
                      </td>
                      <td className="p-4 text-gray-400">
                        {entry.description}
                      </td>
                      <td className="p-4 text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
