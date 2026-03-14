"use client";

import { use, useState, useEffect } from "react";
import BusinessPolicyCard from "@/components/dashboard/BusinessPolicyCard";
import Link from "next/link";

interface Policy {
  id: string;
  businessName: string;
  type: string;
  coverageAmount: string;
  premium: string;
  deductible: string;
  status: string;
  commodityName: string | null;
  equipmentName: string | null;
  expiresAt: string;
}

interface Business {
  id: string;
  name: string;
  ownerName: string;
  serverName: string;
  description: string;
  settings: Record<string, unknown>;
}

export default function InsurerStorefrontPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [business, setBusiness] = useState<Business | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/businesses/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/businesses/${id}/policies`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([biz, pols]) => {
        setBusiness(biz);
        setPolicies(pols);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (!business) return <div className="text-red-400">Insurance company not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{business.name}</h2>
          <p className="text-sm text-gray-400">
            {business.ownerName} &middot; {business.serverName}
          </p>
        </div>
        <Link
          href="/dashboard/businesses/insurers"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Back
        </Link>
      </div>

      {business.description && (
        <p className="text-gray-300">{business.description}</p>
      )}

      <h3 className="text-lg font-semibold text-white">Your Policies</h3>

      {policies.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No policies yet. Purchase a policy to get covered.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((pol) => (
            <BusinessPolicyCard key={pol.id} policy={pol} isHolder />
          ))}
        </div>
      )}
    </div>
  );
}
