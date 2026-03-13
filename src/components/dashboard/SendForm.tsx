"use client";

import { useState } from "react";

interface Farm {
  id: string;
  name: string;
  farmSlot: number;
  serverName: string;
  gameServerId: string;
}

interface SendFormProps {
  farms: Farm[];
  onSent: () => void;
}

export default function SendForm({ farms, onSent }: SendFormProps) {
  const [type, setType] = useState<"money" | "equipment">("money");
  const [amount, setAmount] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [selectedFarm, setSelectedFarm] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);

    const farm = farms.find((f) => f.id === selectedFarm);
    if (!farm) {
      setError("Please select a farm");
      setSending(false);
      return;
    }

    try {
      const body: Record<string, unknown> = {
        type,
        recipientFarmId: farm.id,
        gameServerId: farm.gameServerId,
        farmSlot: farm.farmSlot,
      };

      if (type === "money") {
        body.amount = Number(amount);
      } else {
        body.equipmentId = equipmentId;
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }

      setAmount("");
      setEquipmentId("");
      setSelectedFarm("");
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Type
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("money")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === "money"
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Money
          </button>
          <button
            type="button"
            onClick={() => setType("equipment")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === "equipment"
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Equipment
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Recipient Farm
        </label>
        <select
          value={selectedFarm}
          onChange={(e) => setSelectedFarm(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a farm...</option>
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>
              {farm.name} (Slot {farm.farmSlot}) — {farm.serverName}
            </option>
          ))}
        </select>
      </div>

      {type === "money" ? (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Amount
          </label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Equipment ID
          </label>
          <input
            type="text"
            value={equipmentId}
            onChange={(e) => setEquipmentId(e.target.value)}
            placeholder="e.g. vehicle.johnDeere.8R"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
