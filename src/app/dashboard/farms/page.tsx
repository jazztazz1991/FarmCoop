"use client";

import { useEffect, useState } from "react";
import FarmCard from "@/components/dashboard/FarmCard";
import { apiFetch } from "@/lib/fetch";

interface Server {
  id: string;
  name: string;
}

interface Farm {
  id: string;
  name: string;
  farmSlot: number;
  serverName: string;
  gameServerId: string;
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedServer, setSelectedServer] = useState("");
  const [farmSlot, setFarmSlot] = useState("");
  const [farmName, setFarmName] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    const [farmsRes, serversRes] = await Promise.all([
      fetch("/api/farms/mine"),
      fetch("/api/servers"),
    ]);
    if (farmsRes.ok) setFarms(await farmsRes.json());
    if (serversRes.ok) setServers(await serversRes.json());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setClaiming(true);

    try {
      const res = await apiFetch(`/api/servers/${selectedServer}/farms/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmSlot: Number(farmSlot),
          name: farmName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to claim farm");
      }

      setFarmSlot("");
      setFarmName("");
      setSelectedServer("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setClaiming(false);
    }
  };

  const handleRelease = async (farmId: string, serverId: string) => {
    try {
      const res = await apiFetch(`/api/servers/${serverId}/farms/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to release farm");
      }

      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading farms...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">My Farms</h2>

      {farms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {farms.map((farm) => (
            <div key={farm.id} className="relative group">
              <FarmCard farm={farm} />
              <button
                onClick={() => handleRelease(farm.id, farm.gameServerId)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 transition-all"
              >
                Release
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          No farms claimed yet. Claim one below.
        </p>
      )}

      <div className="max-w-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Claim a Farm</h3>
        <form
          onSubmit={handleClaim}
          className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Server
            </label>
            <select
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a server...</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Farm Slot (1-16)
            </label>
            <input
              type="number"
              min="1"
              max="16"
              value={farmSlot}
              onChange={(e) => setFarmSlot(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Farm Name
            </label>
            <input
              type="text"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="My Farm"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={claiming || !selectedServer || !farmSlot || !farmName}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            {claiming ? "Claiming..." : "Claim Farm"}
          </button>
        </form>
      </div>
    </div>
  );
}
