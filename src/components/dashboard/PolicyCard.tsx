interface PolicyDTO {
  id: string;
  type: "crop" | "vehicle" | "liability";
  coverageAmount: string;
  premium: string;
  deductible: string;
  status: "active" | "expired" | "claimed";
  expiresAt: string;
  commodityName?: string | null;
  equipmentName?: string | null;
}

interface PolicyCardProps {
  policy: PolicyDTO;
  onClaim: (policyId: string) => void;
}

const typeBadgeStyles: Record<string, string> = {
  crop: "bg-green-900/50 text-green-300 border-green-700",
  vehicle: "bg-blue-900/50 text-blue-300 border-blue-700",
  liability: "bg-purple-900/50 text-purple-300 border-purple-700",
};

const typeLabels: Record<string, string> = {
  crop: "Crop",
  vehicle: "Vehicle",
  liability: "Liability",
};

const statusStyles: Record<string, string> = {
  active: "bg-green-900/50 text-green-300 border-green-700",
  expired: "bg-gray-800 text-gray-400 border-gray-700",
  claimed: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  claimed: "Claimed",
};

export default function PolicyCard({ policy, onClaim }: PolicyCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <span
          className={`text-xs font-medium px-2 py-1 rounded border ${typeBadgeStyles[policy.type] ?? typeBadgeStyles.crop}`}
        >
          {typeLabels[policy.type] ?? policy.type}
        </span>
        <span
          className={`text-xs font-medium px-2 py-1 rounded border ${statusStyles[policy.status] ?? statusStyles.active}`}
        >
          {statusLabels[policy.status] ?? policy.status}
        </span>
      </div>

      <p className="text-2xl font-bold text-white mb-4">
        ${Number(policy.coverageAmount).toLocaleString()}
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-gray-500">Premium Paid</span>
          <p className="text-white font-medium">
            ${Number(policy.premium).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Deductible</span>
          <p className="text-white font-medium">
            ${Number(policy.deductible).toLocaleString()}
          </p>
        </div>
        {policy.type === "crop" && policy.commodityName && (
          <div>
            <span className="text-gray-500">Commodity</span>
            <p className="text-white font-medium">{policy.commodityName}</p>
          </div>
        )}
        {policy.type === "vehicle" && policy.equipmentName && (
          <div>
            <span className="text-gray-500">Equipment</span>
            <p className="text-white font-medium">{policy.equipmentName}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Expires: {new Date(policy.expiresAt).toLocaleDateString()}
      </p>

      {policy.status === "active" && (
        <button
          onClick={() => onClaim(policy.id)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          File Claim
        </button>
      )}
    </div>
  );
}
