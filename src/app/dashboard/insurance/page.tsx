"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/fetch";
import PolicyCard from "@/components/dashboard/PolicyCard";
import ClaimCard from "@/components/dashboard/ClaimCard";
import PremiumCalculator from "@/components/dashboard/PremiumCalculator";

interface Server {
  id: string;
  name: string;
}

interface Policy {
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

interface Claim {
  id: string;
  claimAmount: string;
  payout: string;
  reason: string;
  status: "approved" | "denied" | "pending";
}

type Tab = "policies" | "claims" | "purchase";

export default function InsurancePage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("policies");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Policies state
  const [policies, setPolicies] = useState<Policy[]>([]);

  // Claims state
  const [claims, setClaims] = useState<Claim[]>([]);

  // Purchase form state
  const [purchaseType, setPurchaseType] = useState("crop");
  const [purchaseCoverage, setPurchaseCoverage] = useState("");
  const [purchaseTerm, setPurchaseTerm] = useState("90");
  const [purchaseDeductible, setPurchaseDeductible] = useState("");
  const [purchaseCommodityId, setPurchaseCommodityId] = useState("");
  const [purchaseCommodity, setPurchaseCommodity] = useState("");
  const [purchaseStrikePrice, setPurchaseStrikePrice] = useState("");
  const [purchaseEquipmentId, setPurchaseEquipmentId] = useState("");
  const [purchaseEquipment, setPurchaseEquipment] = useState("");
  const [premiumQuote, setPremiumQuote] = useState<string | null>(null);

  // Claim form state
  const [claimPolicyId, setClaimPolicyId] = useState<string | null>(null);
  const [claimAmount, setClaimAmount] = useState("");
  const [claimReason, setClaimReason] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch("/api/servers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setServers)
      .finally(() => setLoading(false));
  }, []);

  const fetchPolicies = useCallback(async () => {
    if (!selectedServer) return;
    setLoading(true);
    const res = await fetch(
      `/api/insurance/policies?gameServerId=${selectedServer}`
    );
    if (res.ok) setPolicies(await res.json());
    setLoading(false);
  }, [selectedServer]);

  const fetchClaims = useCallback(async () => {
    if (!selectedServer) return;
    setLoading(true);
    const res = await fetch(
      `/api/insurance/claims?gameServerId=${selectedServer}`
    );
    if (res.ok) setClaims(await res.json());
    setLoading(false);
  }, [selectedServer]);

  useEffect(() => {
    if (!selectedServer) {
      setPolicies([]);
      setClaims([]);
      return;
    }
    if (activeTab === "policies") fetchPolicies();
    if (activeTab === "claims") fetchClaims();
  }, [selectedServer, activeTab, fetchPolicies, fetchClaims]);

  const handleFileClaim = (policyId: string) => {
    setClaimPolicyId(policyId);
    setClaimAmount("");
    setClaimReason("");
  };

  const handleSubmitClaim = async () => {
    if (!claimPolicyId) return;
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/insurance/policies/${claimPolicyId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimAmount: claimAmount,
          reason: claimReason,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to file claim");
      }
      setSuccess("Claim filed successfully.");
      setClaimPolicyId(null);
      setClaimAmount("");
      setClaimReason("");
      await fetchPolicies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePremiumQuote = async (type: string, coverage: number, termDays: number) => {
    setPremiumQuote(null);
    try {
      const res = await fetch(
        `/api/insurance/premiums?type=${type}&coverageAmount=${coverage}&termDays=${termDays}`
      );
      if (res.ok) {
        const data = await res.json();
        setPremiumQuote(data.premium);
      }
    } catch {
      // silently fail for quote
    }
  };

  const handlePurchase = async () => {
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      const body: Record<string, unknown> = {
        type: purchaseType,
        coverageAmount: purchaseCoverage,
        termDays: Number(purchaseTerm),
        deductible: purchaseDeductible || "0",
        gameServerId: selectedServer,
      };
      if (purchaseType === "crop") {
        body.commodityId = purchaseCommodityId;
        body.commodityName = purchaseCommodity;
        body.strikePrice = purchaseStrikePrice;
      }
      if (purchaseType === "vehicle") {
        body.equipmentId = purchaseEquipmentId;
        body.equipmentName = purchaseEquipment;
      }

      const res = await apiFetch("/api/insurance/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to purchase policy");
      }
      setSuccess("Policy purchased successfully.");
      setPurchaseCoverage("");
      setPurchaseDeductible("");
      setPurchaseCommodityId("");
      setPurchaseCommodity("");
      setPurchaseStrikePrice("");
      setPurchaseEquipmentId("");
      setPurchaseEquipment("");
      setPremiumQuote(null);
      setActiveTab("policies");
      await fetchPolicies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "policies", label: "My Policies" },
    { key: "claims", label: "My Claims" },
    { key: "purchase", label: "Purchase" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Insurance</h2>

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
        <p className="text-gray-500">Select a server to view insurance data.</p>
      )}

      {/* Policies Tab */}
      {!loading && selectedServer && activeTab === "policies" && (
        <div className="space-y-4">
          {policies.length === 0 && (
            <p className="text-gray-500">No policies found.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onClaim={handleFileClaim}
              />
            ))}
          </div>

          {claimPolicyId && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md">
              <h3 className="text-sm font-semibold text-white mb-3">
                File a Claim
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Claim Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={claimReason}
                    onChange={(e) => setClaimReason(e.target.value)}
                    placeholder="Reason for claim"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleSubmitClaim}
                  disabled={actionLoading || !claimAmount || !claimReason}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Submit Claim
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Claims Tab */}
      {!loading && selectedServer && activeTab === "claims" && (
        <div className="space-y-4">
          {claims.length === 0 && (
            <p className="text-gray-500">No claims found.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        </div>
      )}

      {/* Purchase Tab */}
      {!loading && selectedServer && activeTab === "purchase" && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md">
            <h3 className="text-sm font-semibold text-white mb-3">
              Purchase Policy
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Insurance Type
                </label>
                <select
                  value={purchaseType}
                  onChange={(e) => setPurchaseType(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="crop">Crop</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="liability">Liability</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Coverage Amount
                </label>
                <input
                  type="number"
                  min="1"
                  value={purchaseCoverage}
                  onChange={(e) => setPurchaseCoverage(e.target.value)}
                  placeholder="Coverage amount"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Term (days)
                </label>
                <select
                  value={purchaseTerm}
                  onChange={(e) => setPurchaseTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">365 days</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Deductible
                </label>
                <input
                  type="number"
                  min="0"
                  value={purchaseDeductible}
                  onChange={(e) => setPurchaseDeductible(e.target.value)}
                  placeholder="Deductible amount"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {purchaseType === "crop" && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Commodity ID
                    </label>
                    <input
                      type="text"
                      value={purchaseCommodityId}
                      onChange={(e) => setPurchaseCommodityId(e.target.value)}
                      placeholder="e.g. WHEAT, CORN"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Commodity Name
                    </label>
                    <input
                      type="text"
                      value={purchaseCommodity}
                      onChange={(e) => setPurchaseCommodity(e.target.value)}
                      placeholder="e.g. Wheat, Corn"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Strike Price (price floor)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={purchaseStrikePrice}
                      onChange={(e) => setPurchaseStrikePrice(e.target.value)}
                      placeholder="Minimum price guaranteed"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
              {purchaseType === "vehicle" && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Equipment ID
                    </label>
                    <input
                      type="text"
                      value={purchaseEquipmentId}
                      onChange={(e) => setPurchaseEquipmentId(e.target.value)}
                      placeholder="e.g. JOHN_DEERE_8R"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Equipment Name
                    </label>
                    <input
                      type="text"
                      value={purchaseEquipment}
                      onChange={(e) => setPurchaseEquipment(e.target.value)}
                      placeholder="e.g. John Deere 8R"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
              <button
                onClick={handlePurchase}
                disabled={actionLoading || !purchaseCoverage || !purchaseDeductible}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Purchase Policy
              </button>
            </div>
          </div>

          <PremiumCalculator onQuote={handlePremiumQuote} quote={premiumQuote} />
        </div>
      )}
    </div>
  );
}
