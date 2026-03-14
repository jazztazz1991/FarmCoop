"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/fetch";
import type { DealershipListingDTO } from "@/domain/business/dealership/dealership.model";

interface DealershipOwnerPanelProps {
  businessId: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
  sold: "bg-gray-800 text-gray-400 border-gray-700",
};

const categoryStyles: Record<string, string> = {
  equipment: "text-blue-400",
  commodity: "text-amber-400",
};

const EMPTY_FORM = {
  itemId: "",
  itemName: "",
  category: "equipment",
  quantity: "",
  pricePerUnit: "",
};

export default function DealershipOwnerPanel({
  businessId,
}: DealershipOwnerPanelProps) {
  const [items, setItems] = useState<DealershipListingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/businesses/${businessId}/inventory`);
      if (!res.ok) throw new Error("Failed to load inventory");
      const data: DealershipListingDTO[] = await res.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleAddItem = async () => {
    if (
      !form.itemId.trim() ||
      !form.itemName.trim() ||
      !form.quantity ||
      Number(form.quantity) <= 0 ||
      !form.pricePerUnit ||
      Number(form.pricePerUnit) <= 0
    ) {
      setAddError("All fields are required with valid values");
      return;
    }
    setAddError("");
    setAddLoading(true);
    try {
      const res = await apiFetch(`/api/businesses/${businessId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: form.itemId.trim(),
          itemName: form.itemName.trim(),
          category: form.category,
          quantity: Number(form.quantity),
          pricePerUnit: form.pricePerUnit,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? `Failed to add item (${res.status})`
        );
      }
      setForm(EMPTY_FORM);
      await fetchInventory();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdatePrice = async (itemId: string) => {
    if (!newPrice || Number(newPrice) <= 0) return;
    setActionLoading(itemId);
    try {
      const res = await apiFetch(
        `/api/businesses/${businessId}/inventory/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pricePerUnit: newPrice }),
        }
      );
      if (!res.ok) throw new Error("Failed to update price");
      setEditingPriceId(null);
      setNewPrice("");
      await fetchInventory();
    } catch {
      setError("Failed to update price");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setActionLoading(itemId);
    try {
      const res = await apiFetch(
        `/api/businesses/${businessId}/inventory/${itemId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to remove item");
      await fetchInventory();
    } catch {
      setError("Failed to remove item");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Add Item</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <input
            type="text"
            value={form.itemId}
            onChange={(e) => setForm({ ...form, itemId: e.target.value })}
            placeholder="Item ID"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            disabled={addLoading}
          />
          <input
            type="text"
            value={form.itemName}
            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
            placeholder="Item Name"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            disabled={addLoading}
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            disabled={addLoading}
          >
            <option value="equipment">Equipment</option>
            <option value="commodity">Commodity</option>
          </select>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="Quantity"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            disabled={addLoading}
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.pricePerUnit}
            onChange={(e) =>
              setForm({ ...form, pricePerUnit: e.target.value })
            }
            placeholder="Price per Unit"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            disabled={addLoading}
          />
          <button
            onClick={handleAddItem}
            disabled={addLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {addLoading ? "Adding..." : "Add Item"}
          </button>
        </div>

        {addError && <p className="text-red-400 text-sm">{addError}</p>}
      </div>

      {error && (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}

      {loading && <p className="text-gray-400 text-sm">Loading inventory...</p>}

      {!loading && items.length === 0 && !error && (
        <p className="text-gray-500 text-sm">No inventory items yet.</p>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`text-xs font-medium uppercase tracking-wide ${
                    categoryStyles[item.category] ?? "text-gray-400"
                  }`}
                >
                  {item.category}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded border ${
                    statusStyles[item.status] ?? statusStyles.active
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white mb-1">
                {item.itemName}
              </h3>

              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Price</span>
                  <p className="text-white font-medium">
                    ${Number(item.pricePerUnit).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Qty</span>
                  <p className="text-white font-medium">{item.quantity}</p>
                </div>
              </div>

              {item.status === "active" && (
                <div className="flex flex-wrap gap-2">
                  {editingPriceId === item.itemId ? (
                    <div className="flex gap-2 w-full">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="New price"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        disabled={actionLoading === item.itemId}
                      />
                      <button
                        onClick={() => handleUpdatePrice(item.itemId)}
                        disabled={actionLoading === item.itemId}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingPriceId(null);
                          setNewPrice("");
                        }}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingPriceId(item.itemId);
                          setNewPrice(item.pricePerUnit);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Update Price
                      </button>
                      <button
                        onClick={() => handleRemove(item.itemId)}
                        disabled={actionLoading === item.itemId}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
