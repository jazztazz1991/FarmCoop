"use client";

import { useTransactionHistory } from "@/viewmodels/useTransactionHistory";
import TransactionTable from "@/components/dashboard/TransactionTable";

export default function TransactionsPage() {
  const { transactions, loading } = useTransactionHistory();

  if (loading) {
    return <div className="text-gray-400">Loading transactions...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Transactions</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <TransactionTable transactions={transactions} />
      </div>
    </div>
  );
}
