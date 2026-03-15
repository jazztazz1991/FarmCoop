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

function Sparkline({ ledger }: { ledger: LedgerEntry[] }) {
  const amounts = ledger.map((e) => Number(e.amount));
  if (amounts.length < 2) {
    return (
      <svg
        width="110"
        height="44"
        viewBox="0 0 110 44"
        fill="none"
        className="text-teal-400"
      >
        <path
          d="M4,36 C20,28 30,16 54,20 C78,24 88,32 106,24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  let running = 0;
  const series = amounts.map((a) => {
    running += a;
    return running;
  });
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = max - min || 1;
  const W = 110,
    H = 44,
    P = 4;
  const pts = series.map((v, i) => {
    const x = P + (i / (series.length - 1)) * (W - P * 2);
    const y = P + (1 - (v - min) / range) * (H - P * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      className="text-teal-400"
    >
      <path
        d={`M${pts.join(" L")}`}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

  const balanceNum = Number(balance);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-2">
        Business Wallet
      </h3>

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-4xl font-bold text-white">
            ${balanceNum.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Balance: ${balanceNum.toFixed(2)} USD
          </p>
        </div>
        <Sparkline ledger={ledger} />
      </div>

      <div className="mb-3">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (e.g., 100.00)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          disabled={loading}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleAction("deposit")}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Deposit
        </button>
        <button
          onClick={() => handleAction("withdraw")}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-pink-700 hover:bg-pink-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Withdraw
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );
}
