"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/fetch";
import FactoryCard from "@/components/dashboard/FactoryCard";
import RecipeCard from "@/components/dashboard/RecipeCard";

interface Server {
  id: string;
  name: string;
}

interface RecipeInput {
  itemId: string;
  itemName: string;
  quantity: number;
}

interface Recipe {
  id: string;
  name: string;
  outputItemName: string;
  outputQuantity: number;
  processingTime: number;
  inputs: RecipeInput[];
}

interface Factory {
  id: string;
  gameServerId: string;
  ownerId: string;
  recipeId: string;
  recipeName: string;
  name: string;
  cyclesRun: number;
  createdAt: string;
}

type Tab = "factories" | "recipes" | "create";

export default function ProductionPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("factories");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Factories state
  const [factories, setFactories] = useState<Factory[]>([]);

  // Recipes state
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Production modal state
  const [produceFactoryId, setProduceFactoryId] = useState<string | null>(null);
  const [cycles, setCycles] = useState("1");

  // Create factory form state
  const [factoryName, setFactoryName] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch("/api/servers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setServers)
      .finally(() => setLoading(false));
  }, []);

  const fetchFactories = useCallback(async () => {
    if (!selectedServer) return;
    setLoading(true);
    const res = await fetch(`/api/servers/${selectedServer}/factories`);
    if (res.ok) setFactories(await res.json());
    setLoading(false);
  }, [selectedServer]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/recipes");
    if (res.ok) setRecipes(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedServer) {
      setFactories([]);
      return;
    }
    if (activeTab === "factories") fetchFactories();
    if (activeTab === "recipes") fetchRecipes();
    if (activeTab === "create") fetchRecipes();
  }, [selectedServer, activeTab, fetchFactories, fetchRecipes]);

  const handleProduce = (factoryId: string) => {
    setProduceFactoryId(factoryId);
    setCycles("1");
  };

  const handleSubmitProduction = async () => {
    if (!produceFactoryId) return;
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/factories/${produceFactoryId}/produce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycles: Number(cycles) }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start production");
      }
      setSuccess("Production started successfully.");
      setProduceFactoryId(null);
      setCycles("1");
      await fetchFactories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateFactory = async () => {
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/servers/${selectedServer}/factories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: factoryName,
          recipeId: selectedRecipeId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create factory");
      }
      setSuccess("Factory created successfully.");
      setFactoryName("");
      setSelectedRecipeId("");
      setActiveTab("factories");
      await fetchFactories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "factories", label: "My Factories" },
    { key: "recipes", label: "Recipes" },
    { key: "create", label: "Create Factory" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Production</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Select Server
        </label>
        <select
          className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-white border-b-2 border-emerald-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {success && (
        <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-2 rounded text-sm max-w-2xl">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded text-sm max-w-2xl">
          {error}
        </div>
      )}

      {loading && <p className="text-gray-400">Loading...</p>}

      {!loading && !selectedServer && (
        <p className="text-gray-500">Select a server to view production data.</p>
      )}

      {/* Factories Tab */}
      {!loading && selectedServer && activeTab === "factories" && (
        <div className="space-y-4">
          {produceFactoryId && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md">
              <h3 className="text-sm font-semibold text-white mb-3">
                Start Production
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Cycles (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={cycles}
                    onChange={(e) => setCycles(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitProduction}
                    disabled={actionLoading || !cycles}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setProduceFactoryId(null)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {factories.length === 0 && (
            <p className="text-gray-500">No factories found.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {factories.map((factory) => (
              <FactoryCard
                key={factory.id}
                factory={factory}
                onProduce={handleProduce}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recipes Tab */}
      {!loading && selectedServer && activeTab === "recipes" && (
        <div className="space-y-4">
          {recipes.length === 0 && (
            <p className="text-gray-500">No recipes found.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      )}

      {/* Create Factory Tab */}
      {!loading && selectedServer && activeTab === "create" && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md">
          <h3 className="text-sm font-semibold text-white mb-3">
            Create New Factory
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Factory Name
              </label>
              <input
                type="text"
                value={factoryName}
                onChange={(e) => setFactoryName(e.target.value)}
                placeholder="My Factory"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Recipe
              </label>
              <select
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a recipe...</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreateFactory}
              disabled={actionLoading || !factoryName || !selectedRecipeId}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Create Factory
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
