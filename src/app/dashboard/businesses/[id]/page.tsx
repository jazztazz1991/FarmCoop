"use client";

import { use } from "react";
import { useBusiness } from "@/viewmodels/useBusinesses";
import BusinessWalletCard from "@/components/dashboard/BusinessWalletCard";
import BankOwnerPanel from "@/components/dashboard/BankOwnerPanel";
import DealershipOwnerPanel from "@/components/dashboard/DealershipOwnerPanel";
import InsuranceOwnerPanel from "@/components/dashboard/InsuranceOwnerPanel";
import TruckingOwnerPanel from "@/components/dashboard/TruckingOwnerPanel";
import Link from "next/link";

const typeLabels: Record<string, string> = {
  bank: "Bank",
  dealership: "Dealership",
  insurance: "Insurance",
  trucking: "Trucking",
};

const statusStyles: Record<string, string> = {
  active: "bg-green-900/50 text-green-300 border-green-700",
  suspended: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  closed: "bg-gray-800 text-gray-400 border-gray-700",
};

export default function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { business, wallet, loading, error, deposit, withdraw } =
    useBusiness(id);

  if (loading) {
    return <div className="text-gray-400">Loading business...</div>;
  }

  if (error || !business) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error ?? "Business not found"}</p>
        <Link
          href="/dashboard/businesses"
          className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block"
        >
          Back to businesses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-white">{business.name}</h2>
            <span
              className={`text-xs font-medium px-2 py-1 rounded border ${statusStyles[business.status] ?? statusStyles.active}`}
            >
              {business.status}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {typeLabels[business.type] ?? business.type} &middot;{" "}
            {business.serverName} &middot; Owned by {business.ownerName}
          </p>
        </div>
        <Link
          href="/dashboard/businesses/mine"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Back
        </Link>
      </div>

      {business.description && (
        <p className="text-gray-300">{business.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {wallet && (
          <BusinessWalletCard
            balance={wallet.balance}
            ledger={wallet.ledger}
            onDeposit={deposit}
            onWithdraw={withdraw}
          />
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Business Info
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="text-white">
                {typeLabels[business.type] ?? business.type}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Server</span>
              <span className="text-white">{business.serverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    business.status === "active"
                      ? "bg-green-400"
                      : business.status === "suspended"
                        ? "bg-yellow-400"
                        : "bg-gray-500"
                  }`}
                />
                <span className="text-white capitalize">{business.status}</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created</span>
              <span className="text-white">
                {new Date(business.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {business.type === "bank" && <BankOwnerPanel businessId={id} />}
      {business.type === "dealership" && <DealershipOwnerPanel businessId={id} />}
      {business.type === "insurance" && <InsuranceOwnerPanel businessId={id} />}
      {business.type === "trucking" && <TruckingOwnerPanel businessId={id} />}
    </div>
  );
}
