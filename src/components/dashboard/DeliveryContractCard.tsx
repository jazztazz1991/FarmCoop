interface DeliveryContractCardProps {
  contract: {
    id: string;
    businessName: string;
    posterName: string;
    serverName: string;
    farmName: string;
    farmSlot: number;
    itemDescription: string;
    payout: string;
    status: string;
  };
  isOwner?: boolean;
  isPoster?: boolean;
  onAccept?: (id: string) => void;
  onDeliver?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const statusStyles: Record<string, string> = {
  open: "bg-blue-900/50 text-blue-300 border-blue-700",
  accepted: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  delivered: "bg-indigo-900/50 text-indigo-300 border-indigo-700",
  completed: "bg-green-900/50 text-green-300 border-green-700",
  cancelled: "bg-gray-800 text-gray-400 border-gray-700",
};

export default function DeliveryContractCard({
  contract,
  isOwner,
  isPoster,
  onAccept,
  onDeliver,
  onConfirm,
  onCancel,
}: DeliveryContractCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-gray-400">Delivery Job</h3>
        <span
          className={`text-xs font-medium px-2 py-1 rounded border ${statusStyles[contract.status] ?? statusStyles.open}`}
        >
          {contract.status}
        </span>
      </div>

      <p className="text-lg font-semibold text-white mb-2">
        {contract.itemDescription}
      </p>

      <p className="text-2xl font-bold text-emerald-400 mb-3">
        ${Number(contract.payout).toLocaleString()}
      </p>

      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div>
          <span className="text-gray-500">Posted by</span>
          <p className="text-white font-medium">{contract.posterName}</p>
        </div>
        <div>
          <span className="text-gray-500">Destination</span>
          <p className="text-white font-medium">
            {contract.farmName} (Slot {contract.farmSlot})
          </p>
        </div>
        <div>
          <span className="text-gray-500">Server</span>
          <p className="text-white font-medium">{contract.serverName}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {isOwner && contract.status === "open" && (
          <button
            onClick={() => onAccept?.(contract.id)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Accept
          </button>
        )}
        {isOwner && contract.status === "accepted" && (
          <button
            onClick={() => onDeliver?.(contract.id)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Mark Delivered
          </button>
        )}
        {isPoster && contract.status === "delivered" && (
          <button
            onClick={() => onConfirm?.(contract.id)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Confirm Receipt
          </button>
        )}
        {isPoster && contract.status === "open" && (
          <button
            onClick={() => onCancel?.(contract.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
