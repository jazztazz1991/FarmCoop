interface LoanApplicationCardProps {
  application: {
    id: string;
    applicantName: string;
    principal: string;
    termMonths: number;
    interestRateBp: number;
    estimatedMonthlyPayment: string;
    status: string;
    denialReason: string | null;
    createdAt: string;
  };
  isOwner?: boolean;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  approved: "bg-green-900/50 text-green-300 border-green-700",
  denied: "bg-red-900/50 text-red-300 border-red-700",
};

export default function LoanApplicationCard({
  application,
  isOwner,
  onApprove,
  onDeny,
}: LoanApplicationCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-gray-400">Loan Application</h3>
        <span
          className={`text-xs font-medium px-2 py-1 rounded border ${statusStyles[application.status] ?? statusStyles.pending}`}
        >
          {application.status}
        </span>
      </div>

      <p className="text-2xl font-bold text-white mb-3">
        ${Number(application.principal).toLocaleString()}
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-gray-500">Applicant</span>
          <p className="text-white font-medium">{application.applicantName}</p>
        </div>
        <div>
          <span className="text-gray-500">Term</span>
          <p className="text-white font-medium">{application.termMonths} months</p>
        </div>
        <div>
          <span className="text-gray-500">Interest Rate</span>
          <p className="text-white font-medium">
            {(application.interestRateBp / 100).toFixed(2)}%
          </p>
        </div>
        <div>
          <span className="text-gray-500">Monthly Payment</span>
          <p className="text-white font-medium">
            ${Number(application.estimatedMonthlyPayment).toLocaleString()}
          </p>
        </div>
      </div>

      {application.status === "denied" && application.denialReason && (
        <p className="text-red-400 text-sm mb-3">
          Reason: {application.denialReason}
        </p>
      )}

      {isOwner && application.status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove?.(application.id)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => onDeny?.(application.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Deny
          </button>
        </div>
      )}
    </div>
  );
}
