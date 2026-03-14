"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/fetch";

interface DeliveryContractDTO {
  id: string;
  businessId: string;
  businessName: string;
  posterId: string;
  posterName: string;
  serverName: string;
  farmName: string;
  farmSlot: number;
  itemDescription: string;
  payout: string;
  status: string;
  acceptedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

type StatusFilter = "all" | "open" | "accepted" | "in_transit" | "delivered" | "completed" | "cancelled";

interface TruckingOwnerPanelProps {
  businessId: string;
}

const statusStyles: Record<string, string> = {
  open: "bg-blue-900/50 text-blue-300 border-blue-700",
  accepted: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  in_transit: "bg-indigo-900/50 text-indigo-300 border-indigo-700",
  delivered: "bg-indigo-900/50 text-indigo-300 border-indigo-700",
  completed: "bg-green-900/50 text-green-300 border-green-700",
  cancelled: "bg-gray-800 text-gray-400 border-gray-700",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  accepted: "Accepted",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "accepted", label: "Accepted" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatCurrency(value: string): string {
  return `$${Number(value).toLocaleString()}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TruckingOwnerPanel({ businessId }: TruckingOwnerPanelProps) {
  const [deliveries, setDeliveries] = useState<DeliveryContractDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await fetch(`/api/businesses/${businessId}/deliveries`);
      if (!res.ok) throw new Error("Failed to load deliveries");
      const data: DeliveryContractDTO[] = await res.json();
      setDeliveries(data);
      setError(null);
    } catch {
      setError("Failed to load delivery contracts");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    const load = () => { fetchDeliveries(); };
    load();
  }, [fetchDeliveries]);

  const handleAccept = async (deliveryId: string) => {
    setActionLoading(deliveryId);
    try {
      const res = await apiFetch(`/api/businesses/${businessId}/deliveries/${deliveryId}/accept`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to accept delivery");
      }
      await fetchDeliveries();
    } catch {
      setError("Failed to accept delivery");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (deliveryId: string) => {
    setActionLoading(deliveryId);
    try {
      const res = await apiFetch(`/api/businesses/${businessId}/deliveries/${deliveryId}/deliver`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to mark as delivered");
      }
      await fetchDeliveries();
    } catch {
      setError("Failed to mark delivery as delivered");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (deliveryId: string) => {
    setActionLoading(deliveryId);
    try {
      const res = await apiFetch(`/api/businesses/${businessId}/deliveries/${deliveryId}/cancel`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to cancel delivery");
      }
      await fetchDeliveries();
    } catch {
      setError("Failed to cancel delivery");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredDeliveries = statusFilter === "all"
    ? deliveries
    : deliveries.filter((d) => d.status === statusFilter);

  if (loading) {
    return (
      <div className="text-gray-400 text-center py-12">
        Loading delivery contracts...
      </div>
    );
  }

  if (error && deliveries.length === 0) {
    return (
      <div className="text-red-400 text-center py-12">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Delivery Contracts</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm text-gray-400">
            Filter:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {filteredDeliveries.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          No delivery contracts found.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-sm font-medium text-gray-400">Delivery Job</h3>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded border ${statusStyles[delivery.status] ?? statusStyles.open}`}
                >
                  {statusLabels[delivery.status] ?? delivery.status}
                </span>
              </div>

              <p className="text-lg font-semibold text-white mb-2">
                {delivery.itemDescription}
              </p>

              <p className="text-2xl font-bold text-emerald-400 mb-3">
                {formatCurrency(delivery.payout)}
              </p>

              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Posted by</span>
                  <p className="text-white font-medium">{delivery.posterName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Destination</span>
                  <p className="text-white font-medium">
                    {delivery.farmName} (Slot {delivery.farmSlot})
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Server</span>
                  <p className="text-white font-medium">{delivery.serverName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Posted</span>
                  <p className="text-white font-medium">{formatDate(delivery.createdAt)}</p>
                </div>
                {delivery.acceptedAt && (
                  <div>
                    <span className="text-gray-500">Accepted</span>
                    <p className="text-white font-medium">{formatDate(delivery.acceptedAt)}</p>
                  </div>
                )}
                {delivery.deliveredAt && (
                  <div>
                    <span className="text-gray-500">Delivered</span>
                    <p className="text-white font-medium">{formatDate(delivery.deliveredAt)}</p>
                  </div>
                )}
                {delivery.status === "completed" && delivery.completedAt && (
                  <div>
                    <span className="text-gray-500">Completed</span>
                    <p className="text-emerald-400 font-medium">{formatDate(delivery.completedAt)}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {delivery.status === "open" && (
                  <button
                    onClick={() => handleAccept(delivery.id)}
                    disabled={actionLoading === delivery.id}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {actionLoading === delivery.id ? "Accepting..." : "Accept"}
                  </button>
                )}

                {delivery.status === "accepted" && (
                  <>
                    <button
                      onClick={() => handleDeliver(delivery.id)}
                      disabled={actionLoading === delivery.id}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {actionLoading === delivery.id ? "Updating..." : "Mark Delivered"}
                    </button>
                    <button
                      onClick={() => handleCancel(delivery.id)}
                      disabled={actionLoading === delivery.id}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {delivery.status === "delivered" && (
                  <span className="text-indigo-300 text-sm font-medium">
                    Waiting for confirmation
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
