const statusColors: Record<string, string> = {
  pending: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  picked_up: "bg-blue-900/50 text-blue-300 border-blue-700",
  delivered: "bg-green-900/50 text-green-300 border-green-700",
  confirmed: "bg-green-900/50 text-green-300 border-green-700",
  failed: "bg-red-900/50 text-red-300 border-red-700",
  active: "bg-green-900/50 text-green-300 border-green-700",
  sold: "bg-indigo-900/50 text-indigo-300 border-indigo-700",
  cancelled: "bg-gray-800 text-gray-400 border-gray-700",
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colors = statusColors[status] ?? "bg-gray-800 text-gray-400 border-gray-700";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
