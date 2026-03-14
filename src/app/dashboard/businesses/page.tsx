"use client";

import { useState } from "react";
import { useBusinesses } from "@/viewmodels/useBusinesses";
import BusinessCard from "@/components/dashboard/BusinessCard";
import Link from "next/link";

const BUSINESS_TYPES = [
  { value: "", label: "All Types" },
  { value: "bank", label: "Banks" },
  { value: "dealership", label: "Dealerships" },
  { value: "insurance", label: "Insurance" },
  { value: "trucking", label: "Trucking" },
];

export default function BusinessesPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const { businesses, loading } = useBusinesses(
    typeFilter ? { type: typeFilter } : undefined
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Businesses</h2>
        <div className="flex gap-3">
          <Link
            href="/dashboard/businesses/mine"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            My Businesses
          </Link>
          <Link
            href="/dashboard/businesses/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Create Business
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        {BUSINESS_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === t.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-400">Loading businesses...</div>
      ) : businesses.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          No businesses found.
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
