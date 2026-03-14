import { useState } from "react";

interface LedgerEntry {
  id: string;
  amount: string;
  type: string;
  description: string;
  createdAt: string;
}

interface BusinessWalletCardProps {
  balance: string;
  ledger: LedgerEntry[];
  onDeposit: (amount: string) => Promise<void>;
  onWithdraw: (amount: string) => Promise<void>;
}

export default function BusinessWalletCard({
  balance,
  ledger,
  onDeposit,
  onWithdraw,
}: BusinessWalletCardProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAction = async (action: "deposit" | "withdraw") => {
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (action === "deposit") {
        await onDeposit(amount);
      } else {
        await onWithdraw(amount);
      }
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-1">
        Business Wallet
      </h3>
      <p className="text-3xl font-bold text-white mb-4">
        ${Number(balance).toLocaleString()}
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          disabled={loading}
        />
        <button
          onClick={() => handleAction("deposit")}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Deposit
        </button>
        <button
          onClick={() => handleAction("withdraw")}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Withdraw
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {ledger.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">
            Recent Transactions
          </h4>
          <div className="space-y-2">
            {ledger.map((entry) => {
              const isPositive = Number(entry.amount) > 0;
              return (
                <div
                  key={entry.id}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-300">{entry.description}</span>
                  <span
                    className={
                      isPositive ? "text-green-400" : "text-red-400"
                    }
                  >
                    {isPositive ? "+" : ""}
                    {Number(entry.amount).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
