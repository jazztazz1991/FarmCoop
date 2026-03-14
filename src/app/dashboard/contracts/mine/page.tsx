"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/fetch";
import StatusBadge from "@/components/dashboard/StatusBadge";
import Link from "next/link";

interface Contract {
  id: string;
  posterName: string;
  claimerName: string | null;
  commodityName: string;
  quantity: number;
  pricePerUnit: string;
  totalPayout: string;
  status: string;
  expiresAt: string;
  deliveryDeadline: string | null;
  createdAt: string;
}

export default function MyContractsPage() {
  const [tab, setTab] = useState<"posted" | "claimed">("posted");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/contracts/mine?type=${tab}`);
    if (res.ok) {
      setContracts(await res.json());
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleAction = async (
    contractId: string,
    action: "deliver" | "complete" | "cancel"
  ) => {
    setError("");
    setSuccess("");
    setActionId(contractId);

    try {
      let res: Response;
      if (action === "cancel") {
        res = await apiFetch(`/api/contracts/${contractId}`, { method: "DELETE" });
      } else {
        res = await apiFetch(`/api/contracts/${contractId}/${action}`, {
          method: "POST",
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || `Failed to ${action} contract`);
        return;
      }

      const actionMessages = {
        deliver: "Delivery submitted! Waiting for poster confirmation.",
        complete: "Contract completed! Payout released.",
        cancel: "Contract cancelled. Escrow refunded.",
      };
      setSuccess(actionMessages[action]);
      await fetchContracts();
    } catch {
      setError("Network error");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Contracts</h1>
        <Link
          href="/dashboard/contracts"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Browse Contracts
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">{success}</div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("posted")}
          className={`px-4 py-2 rounded-md text-sm ${
            tab === "posted"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Posted by Me
        </button>
        <button
          onClick={() => setTab("claimed")}
          className={`px-4 py-2 rounded-md text-sm ${
            tab === "claimed"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Claimed by Me
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && contracts.length === 0 && (
        <p className="text-gray-500">
          {tab === "posted"
            ? "You haven't posted any contracts yet."
            : "You haven't claimed any contracts yet."}
        </p>
      )}

      {contracts.length > 0 && (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">
                    {contract.commodityName} x{contract.quantity}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {tab === "posted"
                      ? contract.claimerName
                        ? `Claimed by ${contract.claimerName}`
                        : "Waiting for claimer"
                      : `Posted by ${contract.posterName}`}
                  </p>
                </div>
                <StatusBadge status={contract.status} />
              </div>

              <div className="mt-2 text-sm text-gray-600">
                <span>
                  Total: ${Number(contract.totalPayout).toLocaleString()}
                </span>
                {contract.deliveryDeadline && (
                  <span className="ml-4">
                    Deadline:{" "}
                    {new Date(contract.deliveryDeadline).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                {/* Claimer can deliver */}
                {tab === "claimed" && contract.status === "claimed" && (
                  <button
                    onClick={() => handleAction(contract.id, "deliver")}
                    disabled={actionId === contract.id}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                  >
                    {actionId === contract.id ? "..." : "Mark Delivered"}
                  </button>
                )}

                {/* Poster can complete (confirm delivery) */}
                {tab === "posted" && contract.status === "delivered" && (
                  <button
                    onClick={() => handleAction(contract.id, "complete")}
                    disabled={actionId === contract.id}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                  >
                    {actionId === contract.id ? "..." : "Confirm & Pay"}
                  </button>
                )}

                {/* Poster can cancel open or claimed contracts */}
                {tab === "posted" &&
                  (contract.status === "open" || contract.status === "claimed") && (
                    <button
                      onClick={() => handleAction(contract.id, "cancel")}
                      disabled={actionId === contract.id}
                      className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded text-sm border border-red-200"
                    >
                      {actionId === contract.id ? "..." : "Cancel"}
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
