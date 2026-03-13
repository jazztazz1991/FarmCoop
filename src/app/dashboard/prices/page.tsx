"use client";

import { useEffect, useState } from "react";

interface Server {
  id: string;
  name: string;
}

interface CommodityPrice {
  commodityId: string;
  commodityName: string;
  basePrice: string;
  currentPrice: string;
  supply: number;
  demand: number;
  updatedAt: string;
}

interface PriceHistory {
  price: string;
  supply: number;
  demand: number;
  recordedAt: string;
}

export default function PricesPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState("");
  const [prices, setPrices] = useState<CommodityPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);

  // Set price form state
  const [showSetPrice, setShowSetPrice] = useState(false);
  const [newCommodityId, setNewCommodityId] = useState("");
  const [newCommodityName, setNewCommodityName] = useState("");
  const [newBasePrice, setNewBasePrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const [priceSuccess, setPriceSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch("/api/servers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setServers)
      .finally(() => setLoading(false));
  }, []);

  const fetchPrices = () => {
    if (!selectedServer) {
      setPrices([]);
      return;
    }
    setLoading(true);
    fetch(`/api/servers/${selectedServer}/prices`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setPrices)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrices();
  }, [selectedServer]);

  const showHistory = async (commodityId: string) => {
    setSelectedCommodity(commodityId);
    const res = await fetch(
      `/api/servers/${selectedServer}/prices/${commodityId}/history`
    );
    if (res.ok) {
      setHistory(await res.json());
    }
  };

  const handleSetPrice = async () => {
    setPriceError("");
    setPriceSuccess("");
    setActionLoading(true);
    try {
      const res = await fetch(`/api/servers/${selectedServer}/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commodityId: newCommodityId,
          commodityName: newCommodityName,
          basePrice: newBasePrice,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set price");
      }
      setPriceSuccess(`Price set for ${newCommodityName}.`);
      setNewCommodityId("");
      setNewCommodityName("");
      setNewBasePrice("");
      fetchPrices();
    } catch (err) {
      setPriceError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const getPriceChange = (price: CommodityPrice) => {
    const base = Number(price.basePrice);
    const current = Number(price.currentPrice);
    if (base === 0) return 0;
    return Math.round(((current - base) / base) * 100);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Commodity Prices</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Select Server
        </label>
        <select
          className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedServer}
          onChange={(e) => {
            setSelectedServer(e.target.value);
            setSelectedCommodity(null);
          }}
        >
          <option value="">Choose a server...</option>
          {servers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-400">Loading...</p>}

      {!loading && selectedServer && (
        <>
          {/* Set Price Form */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowSetPrice(!showSetPrice)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Set Price
            </button>
          </div>

          {showSetPrice && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md">
              <h3 className="text-sm font-semibold text-white mb-3">
                Set Base Price
              </h3>
              {priceSuccess && (
                <div className="bg-green-900/50 border border-green-700 text-green-300 px-3 py-2 rounded text-sm mb-3">
                  {priceSuccess}
                </div>
              )}
              {priceError && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-3 py-2 rounded text-sm mb-3">
                  {priceError}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Commodity ID
                  </label>
                  <input
                    type="text"
                    value={newCommodityId}
                    onChange={(e) => setNewCommodityId(e.target.value)}
                    placeholder="e.g. WHEAT, CORN, COTTON"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Commodity Name
                  </label>
                  <input
                    type="text"
                    value={newCommodityName}
                    onChange={(e) => setNewCommodityName(e.target.value)}
                    placeholder="e.g. Wheat, Corn, Cotton"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Base Price
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newBasePrice}
                    onChange={(e) => setNewBasePrice(e.target.value)}
                    placeholder="Base price"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleSetPrice}
                  disabled={actionLoading || !newCommodityId || !newCommodityName || !newBasePrice}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Save Price
                </button>
              </div>
            </div>
          )}

          {prices.length === 0 && !loading && (
            <p className="text-gray-500">No commodity prices configured for this server.</p>
          )}

          {prices.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {prices.map((price) => {
                const change = getPriceChange(price);
                return (
                  <button
                    key={price.commodityId}
                    onClick={() => showHistory(price.commodityId)}
                    className={`text-left p-4 rounded-lg border ${
                      selectedCommodity === price.commodityId
                        ? "border-indigo-500 bg-gray-800"
                        : "border-gray-800 bg-gray-900 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{price.commodityName}</h3>
                      <span
                        className={`text-sm font-medium ${
                          change > 0
                            ? "text-green-400"
                            : change < 0
                            ? "text-red-400"
                            : "text-gray-500"
                        }`}
                      >
                        {change > 0 ? "+" : ""}
                        {change}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      ${Number(price.currentPrice).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Base: ${Number(price.basePrice).toLocaleString()}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Supply: {price.supply}</span>
                      <span>Demand: {price.demand}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedCommodity && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Price History —{" "}
                {prices.find((p) => p.commodityId === selectedCommodity)?.commodityName}
              </h3>
              {history.length === 0 ? (
                <p className="text-gray-500">No history recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Price
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Supply
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Demand
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={i} className="border-b border-gray-800">
                          <td className="px-4 py-2 text-sm text-gray-300">
                            {new Date(h.recordedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-white">
                            ${Number(h.price).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-400">{h.supply}</td>
                          <td className="px-4 py-2 text-sm text-gray-400">{h.demand}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!loading && !selectedServer && (
        <p className="text-gray-500">Select a server to view prices.</p>
      )}
    </div>
  );
}
