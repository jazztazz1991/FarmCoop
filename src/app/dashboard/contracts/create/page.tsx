"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/fetch";

interface Server {
  id: string;
  name: string;
}

export default function CreateContractPage() {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [gameServerId, setGameServerId] = useState("");
  const [commodityId, setCommodityId] = useState("");
  const [commodityName, setCommodityName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [expiresIn, setExpiresIn] = useState("7"); // days

  useEffect(() => {
    fetch("/api/servers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setServers)
      .finally(() => setLoading(false));
  }, []);

  const totalPayout =
    quantity && pricePerUnit
      ? Number(quantity) * Number(pricePerUnit)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expiresIn));

    try {
      const res = await apiFetch(`/api/servers/${gameServerId}/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commodityId,
          commodityName,
          quantity: Number(quantity),
          pricePerUnit: Number(pricePerUnit),
          expiresAt: expiresAt.toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create contract");
        return;
      }

      router.push("/dashboard/contracts/mine");
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Post a Contract</h1>

      <p className="text-sm text-gray-500 mb-6">
        Post a contract requesting a commodity delivery. The total payout will be
        escrowed from your wallet and released to the claimer on completion.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Server
          </label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={gameServerId}
            onChange={(e) => setGameServerId(e.target.value)}
            required
          >
            <option value="">Choose a server...</option>
            {servers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commodity ID
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={commodityId}
            onChange={(e) => setCommodityId(e.target.value)}
            placeholder="e.g. wheat, corn, soybeans"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commodity Name
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={commodityName}
            onChange={(e) => setCommodityName(e.target.value)}
            placeholder="e.g. Wheat, Corn, Soybeans"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per Unit
            </label>
            <input
              type="number"
              min="1"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expires in (days)
          </label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
          >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </div>

        {totalPayout > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Total escrow: <strong>${totalPayout.toLocaleString()}</strong> will be
              deducted from your wallet.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !gameServerId}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-md"
        >
          {submitting ? "Posting..." : "Post Contract"}
        </button>
      </form>
    </div>
  );
}
