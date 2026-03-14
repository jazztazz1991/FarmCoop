interface BusinessPolicyCardProps {
  policy: {
    id: string;
    businessName: string;
    type: string;
    coverageAmount: string;
    premium: string;
    deductible: string;
    status: string;
    commodityName: string | null;
    equipmentName: string | null;
    expiresAt: string;
  };
  isHolder?: boolean;
  onFileClaim?: (policyId: string) => void;
}

const statusStyles: Record<string, string> = {
  active: "bg-green-900/50 text-green-300 border-green-700",
  expired: "bg-gray-800 text-gray-400 border-gray-700",
  claimed: "bg-blue-900/50 text-blue-300 border-blue-700",
  cancelled: "bg-red-900/50 text-red-300 border-red-700",
};

const typeLabels: Record<string, string> = {
  crop: "Crop Insurance",
  vehicle: "Vehicle Insurance",
  liability: "Liability Insurance",
};

export default function BusinessPolicyCard({
  policy,
  isHolder,
  onFileClaim,
}: BusinessPolicyCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-gray-400">
          {typeLabels[policy.type] ?? policy.type}
        </h3>
        <span
          className={`text-xs font-medium px-2 py-1 rounded border ${statusStyles[policy.status] ?? statusStyles.active}`}
        >
          {policy.status}
        </span>
      </div>

      <p className="text-2xl font-bold text-white mb-3">
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
        {policy.commodityName && (
          <div>
            <span className="text-gray-500">Commodity</span>
            <p className="text-white font-medium">{policy.commodityName}</p>
          </div>
        )}
        {policy.equipmentName && (
          <div>
            <span className="text-gray-500">Equipment</span>
            <p className="text-white font-medium">{policy.equipmentName}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Expires: {new Date(policy.expiresAt).toLocaleDateString()}
      </p>

      {isHolder && policy.status === "active" && (
        <button
          onClick={() => onFileClaim?.(policy.id)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          File Claim
        </button>
      )}
    </div>
  );
}
