interface ClaimDTO {
  id: string;
  claimAmount: string;
  payout: string;
  reason: string;
  status: "approved" | "denied" | "pending";
}

interface ClaimCardProps {
  claim: ClaimDTO;
}

const statusStyles: Record<string, string> = {
  approved: "bg-green-900/50 text-green-300 border-green-700",
  denied: "bg-red-900/50 text-red-300 border-red-700",
  pending: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
};

const statusLabels: Record<string, string> = {
  approved: "Approved",
  denied: "Denied",
  pending: "Pending",
};

export default function ClaimCard({ claim }: ClaimCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-400">Claim</h3>
        <span
          className={`text-xs font-medium px-2 py-1 rounded border ${statusStyles[claim.status] ?? statusStyles.pending}`}
        >
          {statusLabels[claim.status] ?? claim.status}
        </span>
      </div>

      <p className="text-2xl font-bold text-white mb-4">
        ${Number(claim.claimAmount).toLocaleString()}
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-gray-500">Payout</span>
          <p className="text-white font-medium">
            ${Number(claim.payout).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Reason</span>
          <p className="text-white font-medium">{claim.reason}</p>
        </div>
      </div>
    </div>
  );
}
