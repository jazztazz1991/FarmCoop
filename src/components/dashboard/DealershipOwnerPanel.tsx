"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/fetch";
import type { DealershipListingDTO } from "@/domain/business/dealership/dealership.model";
import { FS25_CATALOG } from "@/domain/business/dealership/fs25-catalog";
import type { FS25Item } from "@/domain/business/dealership/fs25-catalog";
import ItemPicker from "@/components/dashboard/ItemPicker";

interface DealershipOwnerPanelProps {
  businessId: string;
}

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
  const [mode, setMode] = useState<"catalog" | "manual">("catalog");
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<FS25Item | null>(null);

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
        throw new Error(body?.error ?? `Failed to add item (${res.status})`);
      }
      setForm(EMPTY_FORM);
      setSelectedCatalogItem(null);
      setMode("catalog");
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
      {/* Add Item Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Add Item</h2>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Catalog picker OR manual ID + Name fields */}
          {mode === "catalog" ? (
            <ItemPicker
              catalog={FS25_CATALOG}
              selected={selectedCatalogItem}
              onSelect={(item) => {
                setSelectedCatalogItem(item);
                if (item) {
                  setForm((f) => ({
                    ...f,
                    itemId: item.itemId,
                    itemName: item.itemName,
                    category: item.category,
                    pricePerUnit: item.price ? String(item.price) : f.pricePerUnit,
                  }));
                } else {
                  setForm((f) => ({
                    ...f,
                    itemId: "",
                    itemName: "",
                    category: "equipment",
                    pricePerUnit: "",
                  }));
                }
              }}
              onSwitchToManual={() => {
                setMode("manual");
                setSelectedCatalogItem(null);
                setForm(EMPTY_FORM);
              }}
              disabled={addLoading}
            />
          ) : (
            <>
              {/* Manual: Item ID */}
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={form.itemId}
                  onChange={(e) => setForm({ ...form, itemId: e.target.value })}
                  placeholder="Item ID"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  disabled={addLoading}
                />
              </div>

              {/* Manual: Item Name */}
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  placeholder="Item Name"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  disabled={addLoading}
                />
              </div>

              {/* Manual: Category — full width */}
              <div className="col-span-2 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-8 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none"
                  disabled={addLoading}
                >
                  <option value="equipment">Equipment</option>
                  <option value="commodity">Commodity</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Back to catalog toggle */}
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={() => { setMode("catalog"); setForm(EMPTY_FORM); setSelectedCatalogItem(null); }}
                  className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors"
                >
                  ← Pick from catalog
                </button>
              </div>
            </>
          )}

          {/* Quantity */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="Quantity"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              disabled={addLoading}
            />
          </div>

          {/* Price per Unit */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.pricePerUnit}
              onChange={(e) =>
                setForm({ ...form, pricePerUnit: e.target.value })
              }
              placeholder="Price per Unit"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              disabled={addLoading}
            />
          </div>
        </div>

        <button
          onClick={handleAddItem}
          disabled={addLoading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {addLoading ? "Adding..." : "Add New Item"}
        </button>

        {addError && <p className="text-red-400 text-sm mt-3">{addError}</p>}
      </div>

      {/* Inventory Table */}
      {error && (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 font-medium px-6 py-3">Item</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Category</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Qty</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Price</th>
              <th className="text-left text-gray-400 font-medium px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8">
                  Loading inventory...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <p className="text-gray-500">
                      No items in inventory. Add your first item to get started.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">{item.itemName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-blue-400">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{item.quantity}</td>
                  <td className="px-6 py-4 text-gray-300">
                    ${Number(item.pricePerUnit).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {item.status === "active" && (
                      <div className="flex items-center gap-2">
                        {editingPriceId === item.itemId ? (
                          <>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={newPrice}
                              onChange={(e) => setNewPrice(e.target.value)}
                              placeholder="New price"
                              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-500"
                              disabled={actionLoading === item.itemId}
                            />
                            <button
                              onClick={() => handleUpdatePrice(item.itemId)}
                              disabled={actionLoading === item.itemId}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingPriceId(null);
                                setNewPrice("");
                              }}
                              className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingPriceId(item.itemId);
                                setNewPrice(item.pricePerUnit);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Update Price
                            </button>
                            <button
                              onClick={() => handleRemove(item.itemId)}
                              disabled={actionLoading === item.itemId}
                              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {item.status !== "active" && (
                      <span className="text-xs text-gray-500">{item.status}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
