"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { apiFetch } from "@/lib/fetch";

interface Listing {
  id: string;
  itemName: string;
  type: string;
  quantity: number;
  pricePerUnit: string;
  totalPrice: string;
  status: string;
  createdAt: string;
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchListings = async () => {
    const res = await fetch("/api/marketplace/listings/mine");
    if (res.ok) {
      setListings(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleCancel = async (id: string) => {
    setError("");
    setCancellingId(id);

    try {
      const res = await apiFetch(`/api/marketplace/listings/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel listing");
      }

      await fetchListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading your listings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Listings</h2>
        <a
          href="/dashboard/marketplace/sell"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Create Listing
        </a>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {listings.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-500">You have no listings yet.</p>
          <a
            href="/dashboard/marketplace/sell"
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Create your first listing
          </a>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="p-4 font-medium">Item</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Qty</th>
                <th className="p-4 font-medium">Price/Unit</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr
                  key={listing.id}
                  className="border-b border-gray-800/50"
                >
                  <td className="p-4 text-white font-medium">
                    {listing.itemName}
                  </td>
                  <td className="p-4 text-gray-400 capitalize">
                    {listing.type}
                  </td>
                  <td className="p-4 text-gray-300">{listing.quantity}</td>
                  <td className="p-4 text-gray-300">
                    ${Number(listing.pricePerUnit).toLocaleString()}
                  </td>
                  <td className="p-4 text-white font-medium">
                    ${Number(listing.totalPrice).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={listing.status} />
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {listing.status === "active" && (
                      <button
                        onClick={() => handleCancel(listing.id)}
                        disabled={cancellingId === listing.id}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50 text-xs font-medium"
                      >
                        {cancellingId === listing.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <a
        href="/dashboard/marketplace"
        className="text-indigo-400 hover:text-indigo-300 text-sm"
      >
        Back to Marketplace
      </a>
    </div>
  );
}
