interface Loan {
  id: string;
  principal: string;
  remainingBalance: string;
  monthlyPayment: string;
  interestRate: string;
  paymentsRemaining: number;
  status: "active" | "paid_off" | "defaulted";
  nextPaymentDue: string | null;
}

interface LoanCardProps {
  loan: Loan;
  onPay: (loanId: string) => void;
}

const statusStyles: Record<string, string> = {
  active: "bg-green-900/50 text-green-300 border-green-700",
  paid_off: "bg-gray-800 text-gray-400 border-gray-700",
  defaulted: "bg-red-900/50 text-red-300 border-red-700",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  paid_off: "Paid Off",
  defaulted: "Defaulted",
};

export default function LoanCard({ loan, onPay }: LoanCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-400">Loan</h3>
        <span
          className={`text-xs font-medium px-2 py-1 rounded border ${statusStyles[loan.status] ?? statusStyles.active}`}
        >
          {statusLabels[loan.status] ?? loan.status}
        </span>
      </div>

      <p className="text-2xl font-bold text-white mb-4">
        ${Number(loan.principal).toLocaleString()}
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-gray-500">Remaining</span>
          <p className="text-white font-medium">
            ${Number(loan.remainingBalance).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Monthly Payment</span>
          <p className="text-white font-medium">
            ${Number(loan.monthlyPayment).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Interest Rate</span>
          <p className="text-white font-medium">{(Number(loan.interestRate) / 100).toFixed(2)}%</p>
        </div>
        <div>
          <span className="text-gray-500">Payments Left</span>
          <p className="text-white font-medium">{loan.paymentsRemaining}</p>
        </div>
      </div>

      {loan.status === "active" && loan.nextPaymentDue && (
        <p className="text-xs text-gray-500 mb-4">
          Next payment due:{" "}
          {new Date(loan.nextPaymentDue).toLocaleDateString()}
        </p>
      )}

      {loan.status === "active" && (
        <button
          onClick={() => onPay(loan.id)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Make Payment
        </button>
      )}
    </div>
  );
}
