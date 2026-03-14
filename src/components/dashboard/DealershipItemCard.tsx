interface DealershipItemCardProps {
  item: {
    id: string;
    itemName: string;
    category: string;
    quantity: number;
    pricePerUnit: string;
    status: string;
  };
  isOwner?: boolean;
  onBuy?: (itemId: string) => void;
  onRemove?: (itemId: string) => void;
}

const categoryStyles: Record<string, string> = {
  equipment: "text-blue-400",
  commodity: "text-amber-400",
};

export default function DealershipItemCard({
  item,
  isOwner,
  onBuy,
  onRemove,
}: DealershipItemCardProps) {
  const totalPrice = Number(item.pricePerUnit) * item.quantity;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs font-medium uppercase tracking-wide ${categoryStyles[item.category] ?? "text-gray-400"}`}>
          {item.category}
        </span>
        {item.status !== "active" && (
          <span className="text-xs text-gray-500">{item.status}</span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-1">{item.itemName}</h3>

      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div>
          <span className="text-gray-500">Price</span>
          <p className="text-white font-medium">
            ${Number(item.pricePerUnit).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Qty</span>
          <p className="text-white font-medium">{item.quantity}</p>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        Total: ${totalPrice.toLocaleString()}
      </p>

      {item.status === "active" && (
        <div className="flex gap-2">
          {!isOwner && (
            <button
              onClick={() => onBuy?.(item.id)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Buy
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => onRemove?.(item.id)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}
