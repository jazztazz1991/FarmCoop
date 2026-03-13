"use client";

import { useEffect, useState } from "react";

interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  career: string;
}

const CAREERS = [
  { value: "farmer", label: "Farmer", description: "Grow crops and raise livestock" },
  { value: "trucker", label: "Trucker", description: "Haul goods and deliver contracts" },
  { value: "dealer", label: "Dealer", description: "Trade equipment and commodities" },
  { value: "inspector", label: "Inspector", description: "Quality control and oversight" },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [career, setCareer] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setProfile(data);
          setDisplayName(data.displayName);
          setCareer(data.career);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const body: Record<string, string> = {};
      if (displayName !== profile?.displayName) body.displayName = displayName;
      if (career !== profile?.career) body.career = career;

      if (Object.keys(body).length === 0) {
        setSuccess("No changes to save.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update profile");
        return;
      }

      const updated = await res.json();
      setProfile(updated);
      setSuccess("Profile updated!");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!profile) return <p className="text-red-500">Failed to load profile.</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">{success}</div>
      )}

      <div className="flex items-center gap-4 mb-6">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className="w-16 h-16 rounded-full"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-300" />
        )}
        <div>
          <p className="font-semibold text-lg">{profile.displayName}</p>
          <p className="text-sm text-gray-500 capitalize">{profile.career} &middot; {profile.role}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={32}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Career
          </label>
          <div className="grid grid-cols-2 gap-3">
            {CAREERS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCareer(c.value)}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${
                  career === c.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-medium">{c.label}</p>
                <p className="text-xs text-gray-500 mt-1">{c.description}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-md"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
