"use client";

import type { TransactionDTO } from "@/domain/transaction/transaction.model";

interface TransactionLogProps {
  transactions: TransactionDTO[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  delivered: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export function TransactionLog({ transactions }: TransactionLogProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Transaction Log</h2>

      {transactions.length === 0 ? (
        <p className="text-gray-500">No transactions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Farm</th>
                <th className="text-left py-2 px-2">Details</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-100">
                  <td className="py-2 px-2 capitalize">{tx.type}</td>
                  <td className="py-2 px-2">Farm {tx.farmId}</td>
                  <td className="py-2 px-2">
                    {tx.type === "money"
                      ? `$${tx.amount?.toLocaleString()}`
                      : tx.equipmentId}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${statusColors[tx.status] || ""}`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-gray-500">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
