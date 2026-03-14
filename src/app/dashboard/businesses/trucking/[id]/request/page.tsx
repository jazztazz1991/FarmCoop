"use client";

import { use, useState, useEffect } from "react";
import { apiFetch } from "@/lib/fetch";
import { useRouter } from "next/navigation";

interface Farm {
  id: string;
  name: string;
  farmSlot: number;
  serverName: string;
}

interface Business {
  id: string;
  name: string;
}

export default function RequestDeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [destinationFarmId, setDestinationFarmId] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [payout, setPayout] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/businesses/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/farms/mine").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([biz, f]) => {
        setBusiness(biz);
        setFarms(f);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/businesses/${id}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationFarmId, itemDescription, payout }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to post delivery request");
      }
      router.push(`/dashboard/businesses/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (!business) return <div className="text-red-400">Trucking company not found</div>;

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-2xl font-bold text-white">Request Delivery</h2>
      <p className="text-gray-400">
        Post a delivery job to{" "}
        <span className="text-white font-medium">{business.name}</span>
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Destination Farm
            </label>
            <select
              value={destinationFarmId}
              onChange={(e) => setDestinationFarmId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              required
            >
              <option value="">Select a farm</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (Slot {f.farmSlot})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Item Description
            </label>
            <input
              type="text"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              maxLength={200}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              placeholder="e.g., 100 bags of wheat"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Payout (escrowed from your wallet)
            </label>
            <input
              type="number"
              min="1"
              value={payout}
              onChange={(e) => setPayout(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              placeholder="Enter payout amount"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? "Posting..." : "Post Delivery Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
