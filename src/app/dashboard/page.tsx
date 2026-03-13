"use client";

import { useDashboard } from "@/viewmodels/useDashboard";
import WalletCard from "@/components/dashboard/WalletCard";
import FarmCard from "@/components/dashboard/FarmCard";
import TransactionTable from "@/components/dashboard/TransactionTable";
import EventBanner from "@/components/dashboard/EventBanner";

export default function DashboardPage() {
  const { balance, farms, recentTransactions, loading } = useDashboard();

  if (loading) {
    return <div className="text-gray-400">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Overview</h2>

      <EventBanner serverId={farms.length > 0 ? farms[0].gameServerId : undefined} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WalletCard balance={balance} />

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-1">My Farms</h3>
          <p className="text-3xl font-bold text-white">{farms.length}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-1">
            Transactions
          </h3>
          <p className="text-3xl font-bold text-white">
            {recentTransactions.length}
          </p>
        </div>
      </div>

      {farms.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">My Farms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {farms.map((farm) => (
              <FarmCard key={farm.id} farm={farm} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          Recent Activity
        </h3>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <TransactionTable transactions={recentTransactions} />
        </div>
      </div>
    </div>
  );
}
