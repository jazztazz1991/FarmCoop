"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/fetch";

interface LoanApplicationDTO {
  id: string;
  businessId: string;
  businessName: string;
  applicantId: string;
  applicantName: string;
  principal: string;
  termMonths: number;
  interestRateBp: number;
  estimatedMonthlyPayment: string;
  status: string;
  denialReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface BusinessLoanDTO {
  id: string;
  businessId: string;
  businessName: string;
  borrowerId: string;
  borrowerName: string;
  principal: string;
  interestRate: number;
  remainingBalance: string;
  monthlyPayment: string;
  termMonths: number;
  paymentsRemaining: number;
  status: string;
  nextPaymentDue: string | null;
  createdAt: string;
}

type Tab = "applications" | "activeLoans";

interface BankOwnerPanelProps {
  businessId: string;
}

const applicationStatusStyles: Record<string, string> = {
  pending: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  approved: "bg-green-900/50 text-green-300 border-green-700",
  denied: "bg-red-900/50 text-red-300 border-red-700",
};

const loanStatusStyles: Record<string, string> = {
  active: "bg-green-900/50 text-green-300 border-green-700",
  paid_off: "bg-gray-800 text-gray-400 border-gray-700",
  defaulted: "bg-red-900/50 text-red-300 border-red-700",
};

export default function BankOwnerPanel({ businessId }: BankOwnerPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("applications");
  const [applications, setApplications] = useState<LoanApplicationDTO[]>([]);
  const [loans, setLoans] = useState<BusinessLoanDTO[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [error, setError] = useState("");
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      const res = await fetch(
        `/api/businesses/${businessId}/loans/applications`
      );
      if (!res.ok) throw new Error("Failed to fetch applications");
      const data: LoanApplicationDTO[] = await res.json();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoadingApps(false);
    }
  }, [businessId]);

  const fetchLoans = useCallback(async () => {
    setLoadingLoans(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/loans`);
      if (!res.ok) throw new Error("Failed to fetch loans");
      const data: BusinessLoanDTO[] = await res.json();
      setLoans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load loans");
    } finally {
      setLoadingLoans(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchApplications();
    fetchLoans();
  }, [fetchApplications, fetchLoans]);

  const handleApprove = async (appId: string) => {
    setReviewingId(appId);
    setError("");
    try {
      const res = await apiFetch(
        `/api/businesses/${businessId}/loans/applications/${appId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision: "approve" }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve application");
      }
      await fetchApplications();
      await fetchLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setReviewingId(null);
    }
  };

  const handleDenySubmit = async (appId: string) => {
    if (!denialReason.trim()) {
      setError("Please provide a denial reason");
      return;
    }
    setReviewingId(appId);
    setError("");
    try {
      const res = await apiFetch(
        `/api/businesses/${businessId}/loans/applications/${appId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: "deny",
            denialReason: denialReason.trim(),
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to deny application");
      }
      setDenyingId(null);
      setDenialReason("");
      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deny");
    } finally {
      setReviewingId(null);
    }
  };

  const pendingApplications = applications.filter(
    (app) => app.status === "pending"
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("applications")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "applications"
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Applications
          {pendingApplications.length > 0 && (
            <span className="ml-2 bg-yellow-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {pendingApplications.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("activeLoans")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "activeLoans"
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Active Loans
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {activeTab === "applications" && (
        <div className="space-y-4">
          {loadingApps ? (
            <p className="text-gray-400 text-sm">Loading applications...</p>
          ) : pendingApplications.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No pending loan applications.
            </p>
          ) : (
            pendingApplications.map((app) => (
              <div
                key={app.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-sm font-medium text-gray-400">
                    Loan Application
                  </h3>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded border ${
                      applicationStatusStyles[app.status] ??
                      applicationStatusStyles.pending
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <p className="text-2xl font-bold text-white mb-3">
                  ${Number(app.principal).toLocaleString()}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Applicant</span>
                    <p className="text-white font-medium">
                      {app.applicantName}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Term</span>
                    <p className="text-white font-medium">
                      {app.termMonths} months
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Interest Rate</span>
                    <p className="text-white font-medium">
                      {(app.interestRateBp / 100).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Monthly Payment</span>
                    <p className="text-white font-medium">
                      ${Number(app.estimatedMonthlyPayment).toLocaleString()}
                    </p>
                  </div>
                </div>

                {denyingId === app.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={denialReason}
                      onChange={(e) => setDenialReason(e.target.value)}
                      placeholder="Reason for denial..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDenySubmit(app.id)}
                        disabled={reviewingId === app.id}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        {reviewingId === app.id
                          ? "Submitting..."
                          : "Confirm Deny"}
                      </button>
                      <button
                        onClick={() => {
                          setDenyingId(null);
                          setDenialReason("");
                        }}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(app.id)}
                      disabled={reviewingId === app.id}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {reviewingId === app.id ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => {
                        setDenyingId(app.id);
                        setDenialReason("");
                      }}
                      disabled={reviewingId === app.id}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Deny
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "activeLoans" && (
        <div className="space-y-4">
          {loadingLoans ? (
            <p className="text-gray-400 text-sm">Loading loans...</p>
          ) : loans.length === 0 ? (
            <p className="text-gray-500 text-sm">No active loans.</p>
          ) : (
            loans.map((loan) => (
              <div
                key={loan.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-sm font-medium text-gray-400">
                    Borrower: {loan.borrowerName}
                  </h3>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded border ${
                      loanStatusStyles[loan.status] ??
                      loanStatusStyles.active
                    }`}
                  >
                    {loan.status.replace("_", " ")}
                  </span>
                </div>

                <p className="text-2xl font-bold text-white mb-3">
                  ${Number(loan.principal).toLocaleString()}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Remaining Balance</span>
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
                    <p className="text-white font-medium">
                      {(loan.interestRate / 100).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Payments Remaining</span>
                    <p className="text-white font-medium">
                      {loan.paymentsRemaining}
                    </p>
                  </div>
                </div>

                {loan.status === "active" && loan.nextPaymentDue && (
                  <p className="text-xs text-gray-500">
                    Next payment due:{" "}
                    {new Date(loan.nextPaymentDue).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
