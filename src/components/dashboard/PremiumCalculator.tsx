import { useState } from "react";

interface PremiumCalculatorProps {
  onQuote: (type: string, coverage: number, termDays: number) => void;
  quote: string | null;
}

export default function PremiumCalculator({ onQuote, quote }: PremiumCalculatorProps) {
  const [type, setType] = useState("crop");
  const [coverage, setCoverage] = useState("");
  const [termDays, setTermDays] = useState("90");

  const handleCalculate = () => {
    if (!coverage) return;
    onQuote(type, Number(coverage), Number(termDays));
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md">
      <h3 className="text-sm font-semibold text-white mb-3">
        Premium Calculator
      </h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Insurance Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="crop">Crop</option>
            <option value="vehicle">Vehicle</option>
            <option value="liability">Liability</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Coverage Amount
          </label>
          <input
            type="number"
            min="1"
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
            placeholder="Coverage amount"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Term (days)
          </label>
          <select
            value={termDays}
            onChange={(e) => setTermDays(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="180">180 days</option>
            <option value="365">365 days</option>
          </select>
        </div>
        <button
          onClick={handleCalculate}
          disabled={!coverage}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Calculate
        </button>
        {quote && (
          <p className="text-sm text-emerald-400 font-medium">
            Estimated Premium: ${Number(quote).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
