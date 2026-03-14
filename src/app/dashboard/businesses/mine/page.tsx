"use client";

import { useEffect } from "react";
import { useBusinesses } from "@/viewmodels/useBusinesses";
import BusinessCard from "@/components/dashboard/BusinessCard";
import Link from "next/link";

export default function MyBusinessesPage() {
  const { myBusinesses, loading, fetchMyBusinesses } = useBusinesses();

  useEffect(() => {
    const load = () => { fetchMyBusinesses(); };
    load();
  }, [fetchMyBusinesses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Businesses</h2>
        <Link
          href="/dashboard/businesses/create"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Create Business
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : myBusinesses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            You don&apos;t have any businesses yet.
          </p>
          <Link
            href="/dashboard/businesses/create"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Create your first business
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myBusinesses.map((biz) => (
            <BusinessCard key={biz.id} business={biz} isOwner />
          ))}
        </div>
      )}
    </div>
  );
}
