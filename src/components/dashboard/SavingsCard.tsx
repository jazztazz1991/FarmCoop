interface SavingsCardProps {
  savings: {
    balance: string;
    apyBasisPoints: number;
  };
  onDeposit: () => void;
  onWithdraw: () => void;
}

export default function SavingsCard({
  savings,
  onDeposit,
  onWithdraw,
}: SavingsCardProps) {
  const apyPercent = (savings.apyBasisPoints / 100).toFixed(2);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-1">
        Savings Account
      </h3>
      <p className="text-3xl font-bold text-white mb-2">
        ${Number(savings.balance).toLocaleString()}
      </p>
      <p className="text-sm text-emerald-400 mb-4">{apyPercent}% APY</p>

      <div className="flex gap-2">
        <button
          onClick={onDeposit}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Deposit
        </button>
        <button
          onClick={onWithdraw}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Withdraw
        </button>
      </div>
    </div>
  );
}
