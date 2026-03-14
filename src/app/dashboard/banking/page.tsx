"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/fetch";
import LoanCard from "@/components/dashboard/LoanCard";
import SavingsCard from "@/components/dashboard/SavingsCard";
import CertificateCard from "@/components/dashboard/CertificateCard";

interface Server {
  id: string;
  name: string;
}

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

interface Savings {
  balance: string;
  apyBasisPoints: number;
}

interface Certificate {
  id: string;
  principal: string;
  apyBasisPoints: number;
  termDays: number;
  maturesAt: string;
  status: "active" | "matured" | "withdrawn";
}

type Tab = "loans" | "savings" | "cds";

export default function BankingPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("loans");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Loans state
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loanPrincipal, setLoanPrincipal] = useState("");
  const [loanTerm, setLoanTerm] = useState("12");

  // Savings state
  const [savings, setSavings] = useState<Savings | null>(null);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState("");

  // CDs state
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showCdForm, setShowCdForm] = useState(false);
  const [cdAmount, setCdAmount] = useState("");
  const [cdTerm, setCdTerm] = useState("90");

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch("/api/servers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setServers)
      .finally(() => setLoading(false));
  }, []);

  const fetchLoans = useCallback(async () => {
    if (!selectedServer) return;
    setLoading(true);
    const res = await fetch(
      `/api/banking/loans?gameServerId=${selectedServer}`
    );
    if (res.ok) setLoans(await res.json());
    setLoading(false);
  }, [selectedServer]);

  const fetchSavings = useCallback(async () => {
    if (!selectedServer) return;
    setLoading(true);
    const res = await fetch(
      `/api/banking/savings?gameServerId=${selectedServer}`
    );
    if (res.ok) setSavings(await res.json());
    setLoading(false);
  }, [selectedServer]);

  const fetchCertificates = useCallback(async () => {
    if (!selectedServer) return;
    setLoading(true);
    const res = await fetch(
      `/api/banking/certificates?gameServerId=${selectedServer}`
    );
    if (res.ok) setCertificates(await res.json());
    setLoading(false);
  }, [selectedServer]);

  useEffect(() => {
    if (!selectedServer) {
      setLoans([]);
      setSavings(null);
      setCertificates([]);
      return;
    }
    if (activeTab === "loans") fetchLoans();
    if (activeTab === "savings") fetchSavings();
    if (activeTab === "cds") fetchCertificates();
  }, [selectedServer, activeTab, fetchLoans, fetchSavings, fetchCertificates]);

  const handleLoanApply = async () => {
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await apiFetch("/api/banking/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          principal: loanPrincipal,
          termMonths: Number(loanTerm),
          gameServerId: selectedServer,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to apply for loan");
      }
      setSuccess("Loan application submitted successfully.");
      setShowLoanForm(false);
      setLoanPrincipal("");
      setLoanTerm("12");
      await fetchLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoanPay = async (loanId: string) => {
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/banking/loans/${loanId}/pay`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to make payment");
      }
      setSuccess("Payment processed successfully.");
      await fetchLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavingsDeposit = async () => {
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await apiFetch("/api/banking/savings/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: savingsAmount,
          gameServerId: selectedServer,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to deposit");
      }
      setSuccess(`Deposited $${Number(savingsAmount).toLocaleString()} into savings.`);
      setShowDepositForm(false);
      setSavingsAmount("");
      await fetchSavings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavingsWithdraw = async () => {
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await apiFetch("/api/banking/savings/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: savingsAmount,
          gameServerId: selectedServer,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to withdraw");
      }
      setSuccess(`Withdrew $${Number(savingsAmount).toLocaleString()} from savings.`);
      setShowWithdrawForm(false);
      setSavingsAmount("");
      await fetchSavings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCd = async () => {
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await apiFetch("/api/banking/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          principal: cdAmount,
          termDays: Number(cdTerm),
          gameServerId: selectedServer,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to open CD");
      }
      setSuccess("Certificate of Deposit opened successfully.");
      setShowCdForm(false);
      setCdAmount("");
      setCdTerm("90");
      await fetchCertificates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCdWithdraw = async (certificateId: string) => {
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await apiFetch(
        `/api/banking/certificates/${certificateId}/withdraw`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to withdraw CD");
      }
      setSuccess("Certificate withdrawn successfully.");
      await fetchCertificates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "loans", label: "Loans" },
    { key: "savings", label: "Savings" },
    { key: "cds", label: "CDs" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Banking</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Select Server
        </label>
        <select
          className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedServer}
          onChange={(e) => setSelectedServer(e.target.value)}
        >
          <option value="">Choose a server...</option>
          {servers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-white border-b-2 border-emerald-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {success && (
        <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-2 rounded text-sm max-w-2xl">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded text-sm max-w-2xl">
          {error}
        </div>
      )}

      {loading && <p className="text-gray-400">Loading...</p>}

      {!loading && !selectedServer && (
        <p className="text-gray-500">Select a server to view banking data.</p>
      )}

      {/* Loans Tab */}
      {!loading && selectedServer && activeTab === "loans" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowLoanForm(!showLoanForm)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Apply for Loan
            </button>
          </div>

          {showLoanForm && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md">
              <h3 className="text-sm font-semibold text-white mb-3">
                Loan Application
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Principal Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={loanPrincipal}
                    onChange={(e) => setLoanPrincipal(e.target.value)}
                    placeholder="Amount"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Term (months)
                  </label>
                  <select
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                    <option value="60">60 months</option>
                  </select>
                </div>
                <button
                  onClick={handleLoanApply}
                  disabled={actionLoading || !loanPrincipal}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Submit Application
                </button>
              </div>
            </div>
          )}

          {loans.length === 0 && (
            <p className="text-gray-500">No loans found.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} onPay={handleLoanPay} />
            ))}
          </div>
        </div>
      )}

      {/* Savings Tab */}
      {!loading && selectedServer && activeTab === "savings" && (
        <div className="space-y-4">
          {savings ? (
            <>
              <div className="max-w-sm">
                <SavingsCard
                  savings={savings}
                  onDeposit={() => {
                    setShowDepositForm(true);
                    setShowWithdrawForm(false);
                    setSavingsAmount("");
                  }}
                  onWithdraw={() => {
                    setShowWithdrawForm(true);
                    setShowDepositForm(false);
                    setSavingsAmount("");
                  }}
                />
              </div>

              {showDepositForm && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Deposit to Savings
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={savingsAmount}
                      onChange={(e) => setSavingsAmount(e.target.value)}
                      placeholder="Amount"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSavingsDeposit}
                      disabled={actionLoading || !savingsAmount}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Confirm Deposit
                    </button>
                  </div>
                </div>
              )}

              {showWithdrawForm && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Withdraw from Savings
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={savingsAmount}
                      onChange={(e) => setSavingsAmount(e.target.value)}
                      placeholder="Amount"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSavingsWithdraw}
                      disabled={actionLoading || !savingsAmount}
                      className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Confirm Withdraw
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500">No savings account found.</p>
          )}
        </div>
      )}

      {/* CDs Tab */}
      {!loading && selectedServer && activeTab === "cds" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCdForm(!showCdForm)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Open CD
            </button>
          </div>

          {showCdForm && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md">
              <h3 className="text-sm font-semibold text-white mb-3">
                Open Certificate of Deposit
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cdAmount}
                    onChange={(e) => setCdAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Term (days)
                  </label>
                  <select
                    value={cdTerm}
                    onChange={(e) => setCdTerm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                  </select>
                </div>
                <button
                  onClick={handleOpenCd}
                  disabled={actionLoading || !cdAmount}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Open CD
                </button>
              </div>
            </div>
          )}

          {certificates.length === 0 && (
            <p className="text-gray-500">No certificates found.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <CertificateCard
                key={cert.id}
                certificate={cert}
                onWithdraw={handleCdWithdraw}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
