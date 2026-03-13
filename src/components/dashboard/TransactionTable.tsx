import StatusBadge from "./StatusBadge";

interface Transaction {
  id: string;
  type: string;
  amount: number | null;
  equipmentId: string | null;
  status: string;
  farmSlot: number;
  createdAt: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No transactions yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-800">
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Details</th>
            <th className="pb-3 font-medium">Farm Slot</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-gray-800/50">
              <td className="py-3 text-white capitalize">{tx.type}</td>
              <td className="py-3 text-gray-300">
                {tx.type === "money"
                  ? `$${(tx.amount ?? 0).toLocaleString()}`
                  : tx.equipmentId ?? "—"}
              </td>
              <td className="py-3 text-gray-300">{tx.farmSlot}</td>
              <td className="py-3">
                <StatusBadge status={tx.status} />
              </td>
              <td className="py-3 text-gray-400">
                {new Date(tx.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
