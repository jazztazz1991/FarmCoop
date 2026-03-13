interface WalletCardProps {
  balance: string;
}

export default function WalletCard({ balance }: WalletCardProps) {
  const formatted = Number(balance).toLocaleString();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-1">Wallet Balance</h3>
      <p className="text-3xl font-bold text-white">${formatted}</p>
      <div className="mt-4 flex gap-2">
        <a
          href="/dashboard/wallet"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View ledger
        </a>
      </div>
    </div>
  );
}
