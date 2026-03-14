"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/fetch";

interface BusinessClaimDTO {
  id: string;
  businessId: string;
  policyId: string;
  claimAmount: string;
  payout: string;
  reason: string;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
}

interface BusinessPolicyDTO {
  id: string;
  businessId: string;
  businessName: string;
  holderId: string;
  holderName: string | null;
  type: string;
  coverageAmount: string;
  premium: string;
  deductible: string;
  status: string;
  commodityId: string | null;
  commodityName: string | null;
  equipmentId: string | null;
  equipmentName: string | null;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
}

interface InsuranceOwnerPanelProps {
  businessId: string;
}

type Tab = "claims" | "policies";

const claimStatusStyles: Record<string, string> = {
  pending: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  approved: "bg-green-900/50 text-green-300 border-green-700",
  denied: "bg-red-900/50 text-red-300 border-red-700",
};

const policyStatusStyles: Record<string, string> = {
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

export default function InsuranceOwnerPanel({
  businessId,
}: InsuranceOwnerPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("claims");
  const [claims, setClaims] = useState<BusinessClaimDTO[]>([]);
  const [policies, setPolicies] = useState<BusinessPolicyDTO[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [error, setError] = useState("");
  const [reviewingClaimId, setReviewingClaimId] = useState<string | null>(null);
  const [payoutAmounts, setPayoutAmounts] = useState<Record<string, string>>(
    {}
  );

  const fetchClaims = useCallback(async () => {
    setLoadingClaims(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/claims`);
      if (!res.ok) throw new Error("Failed to load claims");
      const data = await res.json();
      setClaims(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load claims");
    } finally {
      setLoadingClaims(false);
    }
  }, [businessId]);

  const fetchPolicies = useCallback(async () => {
    setLoadingPolicies(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/policies`);
      if (!res.ok) throw new Error("Failed to load policies");
      const data = await res.json();
      setPolicies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load policies");
    } finally {
      setLoadingPolicies(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchClaims();
    fetchPolicies();
  }, [fetchClaims, fetchPolicies]);

  const handleApprove = async (claimId: string) => {
    const payout = payoutAmounts[claimId];
    if (!payout || Number(payout) <= 0) {
      setError("Please enter a valid payout amount");
      return;
    }

    setError("");
    setReviewingClaimId(claimId);
    try {
      const res = await apiFetch(
        `/api/businesses/${businessId}/claims/${claimId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision: "approve", payout }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve claim");
      }
      await fetchClaims();
      setPayoutAmounts((prev) => {
        const next = { ...prev };
        delete next[claimId];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve claim");
    } finally {
      setReviewingClaimId(null);
    }
  };

  const handleDeny = async (claimId: string) => {
    setError("");
    setReviewingClaimId(claimId);
    try {
      const res = await apiFetch(
        `/api/businesses/${businessId}/claims/${claimId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision: "deny" }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to deny claim");
      }
      await fetchClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deny claim");
    } finally {
      setReviewingClaimId(null);
    }
  };

  const pendingClaims = claims.filter((c) => c.status === "pending");

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-gray-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("claims")}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeTab === "claims"
              ? "bg-indigo-600 text-white"
              : "bg-gray-900 text-gray-400 hover:text-white"
          }`}
        >
          Pending Claims
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("policies")}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeTab === "policies"
              ? "bg-indigo-600 text-white"
              : "bg-gray-900 text-gray-400 hover:text-white"
          }`}
        >
          Policies
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Pending Claims tab */}
      {activeTab === "claims" && (
        <div className="space-y-4">
          {loadingClaims ? (
            <p className="text-gray-400 text-sm">Loading claims...</p>
          ) : pendingClaims.length === 0 ? (
            <p className="text-gray-500 text-sm">No pending claims</p>
          ) : (
            pendingClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-sm font-medium text-gray-400">
                    Insurance Claim
                  </h3>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded border ${
                      claimStatusStyles[claim.status] ??
                      claimStatusStyles.pending
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>

                <p className="text-2xl font-bold text-white mb-2">
                  ${Number(claim.claimAmount).toLocaleString()}
                </p>

                <p className="text-sm text-gray-300 mb-4">{claim.reason}</p>

                {/* Payout input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Payout Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter payout amount..."
                    value={payoutAmounts[claim.id] ?? ""}
                    onChange={(e) =>
                      setPayoutAmounts((prev) => ({
                        ...prev,
                        [claim.id]: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={reviewingClaimId === claim.id}
                    onClick={() => handleApprove(claim.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {reviewingClaimId === claim.id ? "Reviewing..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={reviewingClaimId === claim.id}
                    onClick={() => handleDeny(claim.id)}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Policies tab */}
      {activeTab === "policies" && (
        <div className="space-y-4">
          {loadingPolicies ? (
            <p className="text-gray-400 text-sm">Loading policies...</p>
          ) : policies.length === 0 ? (
            <p className="text-gray-500 text-sm">No policies found</p>
          ) : (
            policies.map((policy) => (
              <div
                key={policy.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-sm font-medium text-gray-400">
                    {typeLabels[policy.type] ?? policy.type}
                  </h3>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded border ${
                      policyStatusStyles[policy.status] ??
                      policyStatusStyles.active
                    }`}
                  >
                    {policy.status}
                  </span>
                </div>

                {policy.holderName && (
                  <p className="text-sm text-gray-300 mb-2">
                    Holder: {policy.holderName}
                  </p>
                )}

                <p className="text-2xl font-bold text-white mb-3">
                  ${Number(policy.coverageAmount).toLocaleString()}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Premium</span>
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
                      <p className="text-white font-medium">
                        {policy.commodityName}
                      </p>
                    </div>
                  )}
                  {policy.equipmentName && (
                    <div>
                      <span className="text-gray-500">Equipment</span>
                      <p className="text-white font-medium">
                        {policy.equipmentName}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 text-xs text-gray-500">
                  <span>
                    Starts: {new Date(policy.startsAt).toLocaleDateString()}
                  </span>
                  <span>
                    Expires: {new Date(policy.expiresAt).toLocaleDateString()}
                  </span>
                  <span>
                    Created: {new Date(policy.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
