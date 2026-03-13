"use client";

import { useEffect, useState } from "react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  career: string;
  value: string;
}

type LeaderboardType = "richest" | "top_traders" | "top_contractors";

const tabs: { type: LeaderboardType; label: string; valueLabel: string }[] = [
  { type: "richest", label: "Richest Players", valueLabel: "Balance" },
  { type: "top_traders", label: "Top Traders", valueLabel: "Purchases" },
  { type: "top_contractors", label: "Top Contractors", valueLabel: "Completed" },
];

const careerEmoji: Record<string, string> = {
  farmer: "🌾",
  trucker: "🚛",
  dealer: "🤝",
  inspector: "🔍",
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("richest");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = () => {
      setLoading(true);
      fetch(`/api/leaderboard?type=${activeTab}`)
        .then((r) => (r.ok ? r.json() : []))
        .then(setEntries)
        .finally(() => setLoading(false));
    };
    fetchLeaderboard();
  }, [activeTab]);

  const activeTabConfig = tabs.find((t) => t.type === activeTab)!;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            className={`px-4 py-2 rounded-md text-sm ${
              activeTab === tab.type
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && entries.length === 0 && (
        <p className="text-gray-500">No entries yet. Start trading!</p>
      )}

      {entries.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Player
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                  Career
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                  {activeTabConfig.valueLabel}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr
                  key={entry.userId}
                  className={
                    entry.rank <= 3 ? "bg-yellow-50" : ""
                  }
                >
                  <td className="px-4 py-3 text-sm font-bold">
                    {entry.rank <= 3
                      ? ["🥇", "🥈", "🥉"][entry.rank - 1]
                      : `#${entry.rank}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300" />
                      )}
                      <span className="font-medium">{entry.displayName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">
                    {careerEmoji[entry.career] || ""} {entry.career}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono font-medium">
                    {activeTab === "richest"
                      ? `$${Number(entry.value).toLocaleString()}`
                      : entry.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
