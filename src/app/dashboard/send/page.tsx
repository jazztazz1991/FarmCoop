"use client";

import { useRouter } from "next/navigation";
import { useSendTransaction } from "@/viewmodels/useSendTransaction";
import SendForm from "@/components/dashboard/SendForm";

export default function SendPage() {
  const router = useRouter();
  const { farms, loading } = useSendTransaction();

  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold text-white mb-6">
        Send Money or Equipment
      </h2>

      {farms.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400 mb-4">
            You need to claim a farm before you can send transactions.
          </p>
          <a
            href="/dashboard/farms"
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Go to My Farms
          </a>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <SendForm
            farms={farms}
            onSent={() => router.push("/dashboard/transactions")}
          />
        </div>
      )}
    </div>
  );
}
