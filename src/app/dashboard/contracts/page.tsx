"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import Link from "next/link";

interface Server {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  posterName: string;
  commodityName: string;
  quantity: number;
  pricePerUnit: string;
  totalPayout: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function ContractsPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/servers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setServers)
      .finally(() => setLoading(false));
  }, []);

  const fetchContracts = async () => {
    if (!selectedServer) {
      setContracts([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/servers/${selectedServer}/contracts`);
    if (res.ok) {
      setContracts(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContracts();
  }, [selectedServer]);

  const handleClaim = async (contractId: string) => {
    setError("");
    setSuccess("");
    setClaimingId(contractId);

    try {
      const res = await fetch(`/api/contracts/${contractId}/claim`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to claim contract");
        return;
      }

      setSuccess("Contract claimed! You have 48 hours to deliver.");
      await fetchContracts();
    } catch {
      setError("Network error");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contract Board</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/contracts/mine"
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
          >
            My Contracts
          </Link>
          <Link
            href="/dashboard/contracts/create"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Post Contract
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">{success}</div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Server
        </label>
        <select
          className="w-full max-w-sm border border-gray-300 rounded-md px-3 py-2"
          value={selectedServer}
          onChange={(e) => setSelectedServer(e.target.value)}
        >
          <option value="">Choose a server...</option>
          {servers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && selectedServer && contracts.length === 0 && (
        <p className="text-gray-500">No open contracts for this server.</p>
      )}

      {contracts.length > 0 && (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">
                    {contract.commodityName} x{contract.quantity}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Posted by {contract.posterName}
                  </p>
                </div>
                <StatusBadge status={contract.status} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Price per unit:</span>{" "}
                  <span className="font-medium">
                    ${Number(contract.pricePerUnit).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Total payout:</span>{" "}
                  <span className="font-medium text-green-600">
                    ${Number(contract.totalPayout).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Expires:</span>{" "}
                  {new Date(contract.expiresAt).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => handleClaim(contract.id)}
                  disabled={claimingId === contract.id}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm"
                >
                  {claimingId === contract.id ? "Claiming..." : "Claim Contract"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
