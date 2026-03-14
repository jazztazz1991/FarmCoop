"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/fetch";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      setNotifications(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    setError("");
    setMarkingAllRead(true);
    try {
      const res = await apiFetch("/api/notifications", { method: "POST" });
      if (!res.ok) throw new Error("Failed to mark notifications as read");
      await fetchNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    setError("");
    setMarkingReadId(id);
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setMarkingReadId(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return <div className="text-gray-400">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAllRead}
            className="text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
          >
            {markingAllRead ? "Marking..." : "Mark all as read"}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-gray-900 border rounded-lg p-4 flex items-start gap-3 ${
                n.read
                  ? "border-gray-800"
                  : "border-indigo-500/50 bg-indigo-950/20"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">
                    {n.title}
                  </h4>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">{n.message}</p>
                <p className="text-xs text-gray-600 mt-2">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  disabled={markingReadId === n.id}
                  className="text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50 shrink-0"
                >
                  {markingReadId === n.id ? "..." : "Mark read"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
