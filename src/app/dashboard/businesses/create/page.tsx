"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/fetch";

interface Server {
  id: string;
  name: string;
}

const CAREER_BUSINESS_MAP: Record<string, { type: string; label: string }> = {
  banker: { type: "bank", label: "Bank" },
  dealer: { type: "dealership", label: "Dealership" },
  inspector: { type: "insurance", label: "Insurance Company" },
  trucker: { type: "trucking", label: "Trucking Company" },
};

export default function CreateBusinessPage() {
  const router = useRouter();
  const [career, setCareer] = useState<string | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [gameServerId, setGameServerId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, serversRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/servers"),
        ]);
        if (meRes.ok) {
          const user = await meRes.json();
          setCareer(user.career);
        }
        if (serversRes.ok) {
          setServers(await serversRes.json());
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const businessOption = career ? CAREER_BUSINESS_MAP[career] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessOption || !gameServerId || !name) return;

    setError("");
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameServerId,
          type: businessOption.type,
          name,
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create business");
      }

      const biz = await res.json();
      router.push(`/dashboard/businesses/${biz.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  if (!businessOption) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Create Business</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-2">
            Your career ({career ?? "unknown"}) cannot create a business.
          </p>
          <p className="text-gray-500 text-sm">
            Only bankers, dealers, inspectors, and truckers can run businesses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-2xl font-bold text-white">Create Business</h2>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <p className="text-sm text-gray-400 mb-4">
          As a <span className="text-indigo-400 font-medium">{career}</span>,
          you can create a{" "}
          <span className="text-white font-medium">{businessOption.label}</span>
          .
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Server
            </label>
            <select
              value={gameServerId}
              onChange={(e) => setGameServerId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              required
            >
              <option value="">Select a server</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              placeholder="Enter business name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Describe your business"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? "Creating..." : `Create ${businessOption.label}`}
          </button>
        </form>
      </div>
    </div>
  );
}
