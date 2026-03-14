"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/fetch";
import StatusBadge from "@/components/dashboard/StatusBadge";

interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  itemName: string;
  type: string;
  quantity: number;
  pricePerUnit: string;
  totalPrice: string;
  status: string;
  createdAt: string;
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchListings = useCallback(async () => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (searchQuery) params.set("search", searchQuery);

    const res = await fetch(`/api/marketplace/listings?${params}`);
    if (res.ok) {
      setListings(await res.json());
    }
    setLoading(false);
  }, [typeFilter, searchQuery]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const handleBuy = async (listingId: string) => {
    setError("");
    setSuccess("");
    setBuyingId(listingId);

    try {
      const res = await apiFetch(`/api/marketplace/listings/${listingId}/buy`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Purchase failed");
      }

      setSuccess("Purchase successful! Your wallet has been debited.");
      await fetchListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading marketplace...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Marketplace</h2>
        <div className="flex gap-2">
          <a
            href="/dashboard/marketplace/my-listings"
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            My Listings
          </a>
          <a
            href="/dashboard/marketplace/sell"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Create Listing
          </a>
        </div>
      </div>

      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Search
          </button>
        </form>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Types</option>
          <option value="commodity">Commodity</option>
          <option value="equipment">Equipment</option>
        </select>
      </div>

      {success && (
        <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-2 rounded text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {listings.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-500">No listings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">
                  {listing.itemName}
                </h4>
                <StatusBadge status={listing.status} />
              </div>
              <p className="text-xs text-gray-400 capitalize mb-1">
                {listing.type} &middot; Qty: {listing.quantity}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Seller: {listing.sellerName}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-white">
                    ${Number(listing.totalPrice).toLocaleString()}
                  </span>
                  {listing.quantity > 1 && (
                    <span className="text-xs text-gray-500 ml-1">
                      (${Number(listing.pricePerUnit).toLocaleString()}/ea)
                    </span>
                  )}
                </div>
                {listing.status === "active" && (
                  <button
                    onClick={() => handleBuy(listing.id)}
                    disabled={buyingId === listing.id}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                  >
                    {buyingId === listing.id ? "Buying..." : "Buy"}
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
