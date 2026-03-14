"use client";

import { use, useState, useEffect } from "react";
import DealershipItemCard from "@/components/dashboard/DealershipItemCard";
import Link from "next/link";
import { apiFetch } from "@/lib/fetch";

interface Listing {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  pricePerUnit: string;
  status: string;
}

interface Business {
  id: string;
  name: string;
  ownerName: string;
  serverName: string;
  description: string;
}

export default function DealershipStorefrontPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [business, setBusiness] = useState<Business | null>(null);
  const [inventory, setInventory] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/businesses/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/businesses/${id}/inventory`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([biz, inv]) => {
        setBusiness(biz);
        setInventory(inv);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuy = async (itemId: string) => {
    setMessage("");
    // TODO: show farm picker modal. For now, use first farm.
    const farmsRes = await fetch("/api/farms/mine");
    const farms = farmsRes.ok ? await farmsRes.json() : [];
    if (farms.length === 0) {
      setMessage("You need a farm to receive deliveries");
      return;
    }

    const res = await apiFetch(`/api/businesses/${id}/inventory/${itemId}/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientFarmId: farms[0].id }),
    });

    if (res.ok) {
      setMessage("Purchase successful! Item will be delivered to your farm.");
      setInventory((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: "sold" } : item
        )
      );
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Purchase failed");
    }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (!business) return <div className="text-red-400">Dealership not found</div>;

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
          href="/dashboard/businesses/dealerships"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Back
        </Link>
      </div>

      {business.description && (
        <p className="text-gray-300">{business.description}</p>
      )}

      {message && (
        <div className={`text-sm p-3 rounded-lg ${message.includes("successful") ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
          {message}
        </div>
      )}

      {inventory.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          No items in stock.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((item) => (
            <DealershipItemCard
              key={item.id}
              item={item}
              onBuy={handleBuy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
