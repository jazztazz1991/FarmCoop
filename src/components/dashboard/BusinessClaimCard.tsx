interface BusinessClaimCardProps {
  claim: {
    id: string;
    claimAmount: string;
    payout: string;
    reason: string;
    status: string;
    resolvedAt: string | null;
  };
  isOwner?: boolean;
  onApprove?: (claimId: string) => void;
  onDeny?: (claimId: string) => void;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  approved: "bg-green-900/50 text-green-300 border-green-700",
  denied: "bg-red-900/50 text-red-300 border-red-700",
};

export default function BusinessClaimCard({
  claim,
  isOwner,
  onApprove,
  onDeny,
}: BusinessClaimCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-gray-400">Insurance Claim</h3>
        <span
          className={`text-xs font-medium px-2 py-1 rounded border ${statusStyles[claim.status] ?? statusStyles.pending}`}
        >
          {claim.status}
        </span>
      </div>

      <p className="text-2xl font-bold text-white mb-2">
        ${Number(claim.claimAmount).toLocaleString()}
      </p>

      <p className="text-sm text-gray-300 mb-3">{claim.reason}</p>

      {claim.status === "approved" && (
        <p className="text-sm text-green-400 mb-3">
          Payout: ${Number(claim.payout).toLocaleString()}
        </p>
      )}

      {isOwner && claim.status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove?.(claim.id)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => onDeny?.(claim.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Deny
          </button>
        </div>
      )}
    </div>
  );
}
