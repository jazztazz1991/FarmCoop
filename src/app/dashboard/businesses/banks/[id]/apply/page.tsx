"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/fetch";

interface BankInfo {
  id: string;
  name: string;
  settings: { interestRateBp?: number; maxLoanAmount?: string };
}

export default function ApplyForLoanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [bank, setBank] = useState<BankInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [principal, setPrincipal] = useState("");
  const [termMonths, setTermMonths] = useState(12);

  useEffect(() => {
    fetch(`/api/businesses/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setBank)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/businesses/${id}/loans/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ principal, termMonths }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit application");
      }
      router.push(`/dashboard/businesses/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (!bank) return <div className="text-red-400">Bank not found</div>;

  const rate = bank.settings?.interestRateBp ?? 500;
  const maxLoan = bank.settings?.maxLoanAmount ?? "1000000";

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-2xl font-bold text-white">Apply for Loan</h2>
      <p className="text-gray-400">
        Apply at <span className="text-white font-medium">{bank.name}</span> —{" "}
        {(rate / 100).toFixed(2)}% interest, max $
        {Number(maxLoan).toLocaleString()}
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Loan Amount
            </label>
            <input
              type="number"
              min="1"
              max={maxLoan}
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Enter amount"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Term (months)
            </label>
            <select
              value={termMonths}
              onChange={(e) => setTermMonths(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {[3, 6, 12, 24, 36, 48, 60].map((m) => (
                <option key={m} value={m}>
                  {m} months
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
