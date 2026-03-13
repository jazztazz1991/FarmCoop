interface Certificate {
  id: string;
  principal: string;
  apyBasisPoints: number;
  termDays: number;
  maturesAt: string;
  status: "active" | "matured" | "withdrawn";
}

interface CertificateCardProps {
  certificate: Certificate;
  onWithdraw: (certificateId: string) => void;
}

const statusStyles: Record<string, string> = {
  active: "bg-green-900/50 text-green-300 border-green-700",
  matured: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  withdrawn: "bg-gray-800 text-gray-400 border-gray-700",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  matured: "Matured",
  withdrawn: "Withdrawn",
};

export default function CertificateCard({
  certificate,
  onWithdraw,
}: CertificateCardProps) {
  const apyPercent = (certificate.apyBasisPoints / 100).toFixed(2);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-400">
          Certificate of Deposit
        </h3>
        <span
          className={`text-xs font-medium px-2 py-1 rounded border ${statusStyles[certificate.status] ?? statusStyles.active}`}
        >
          {statusLabels[certificate.status] ?? certificate.status}
        </span>
      </div>

      <p className="text-2xl font-bold text-white mb-4">
        ${Number(certificate.principal).toLocaleString()}
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-gray-500">APY</span>
          <p className="text-emerald-400 font-medium">{apyPercent}%</p>
        </div>
        <div>
          <span className="text-gray-500">Term</span>
          <p className="text-white font-medium">{certificate.termDays} days</p>
        </div>
        <div>
          <span className="text-gray-500">Maturity Date</span>
          <p className="text-white font-medium">
            {new Date(certificate.maturesAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {certificate.status === "active" && (
        <button
          onClick={() => onWithdraw(certificate.id)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Withdraw
        </button>
      )}
    </div>
  );
}
