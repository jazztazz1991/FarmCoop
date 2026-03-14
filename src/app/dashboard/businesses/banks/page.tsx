"use client";

import { useBusinesses } from "@/viewmodels/useBusinesses";
import BusinessCard from "@/components/dashboard/BusinessCard";

export default function BrowseBanksPage() {
  const { businesses, loading } = useBusinesses({ type: "bank" });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Player-Run Banks</h2>

      {loading ? (
        <div className="text-gray-400">Loading banks...</div>
      ) : businesses.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          No player-run banks found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((biz) => (
            <BusinessCard key={biz.id} business={biz} />
          ))}
        </div>
      )}
    </div>
  );
}
