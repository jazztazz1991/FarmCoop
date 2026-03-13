"use client";

import { useState } from "react";
import { EQUIPMENT_CATALOG } from "@/domain/transaction/equipment-catalog";

interface TransactionFormProps {
  onSubmit: (data: {
    type: string;
    farmId: number;
    amount?: number;
    equipmentId?: string;
  }) => Promise<void>;
}

export function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [type, setType] = useState<"money" | "equipment">("money");
  const [farmId, setFarmId] = useState(1);
  const [amount, setAmount] = useState(50000);
  const [equipmentId, setEquipmentId] = useState(EQUIPMENT_CATALOG[0].xmlPath);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        type,
        farmId,
        ...(type === "money" ? { amount } : { equipmentId }),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-6 mb-6"
    >
      <h2 className="text-lg font-semibold mb-4">Send Transaction</h2>

      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="type"
            value="money"
            checked={type === "money"}
            onChange={() => setType("money")}
          />
          Send Money
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="type"
            value="equipment"
            checked={type === "equipment"}
            onChange={() => setType("equipment")}
          />
          Send Equipment
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label
            htmlFor="farmId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Farm ID (1-16)
          </label>
          <input
            id="farmId"
            type="number"
            min={1}
            max={16}
            value={farmId}
            onChange={(e) => setFarmId(Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        {type === "money" ? (
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Amount ($)
            </label>
            <input
              id="amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
        ) : (
          <div>
            <label
              htmlFor="equipment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Equipment
            </label>
            <select
              id="equipment"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {EQUIPMENT_CATALOG.map((item) => (
                <option key={item.id} value={item.xmlPath}>
                  {item.name} ({item.category})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send Transaction"}
      </button>
    </form>
  );
}
