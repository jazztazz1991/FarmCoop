"use client";

import { useEffect, useState } from "react";

interface Server {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  type: string;
  multiplier: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const typeLabels: Record<string, string> = {
  bonus_payout: "Bonus Payout",
  double_prices: "Double Prices",
  harvest_rush: "Harvest Rush",
  custom: "Special Event",
};

export default function EventsPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState("");
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/servers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setServers)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedServer) {
      queueMicrotask(() => {
        setActiveEvents([]);
        setUpcomingEvents([]);
      });
      return;
    }
    const fetchEvents = () => {
      setLoading(true);
      Promise.all([
      fetch(`/api/servers/${selectedServer}/events?view=active`).then((r) =>
        r.ok ? r.json() : []
      ),
      fetch(`/api/servers/${selectedServer}/events?view=upcoming`).then((r) =>
        r.ok ? r.json() : []
      ),
    ])
      .then(([active, upcoming]) => {
        setActiveEvents(active);
        setUpcomingEvents(upcoming);
      })
      .finally(() => setLoading(false));
    };
    fetchEvents();
  }, [selectedServer]);

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString()} - ${e.toLocaleDateString()}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Events</h1>

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

      {!loading && selectedServer && activeEvents.length === 0 && upcomingEvents.length === 0 && (
        <p className="text-gray-500">No events scheduled for this server.</p>
      )}

      {activeEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-green-700">Active Now</h2>
          <div className="space-y-3">
            {activeEvents.map((event) => (
              <div
                key={event.id}
                className="bg-green-50 border border-green-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {event.description}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                    {event.multiplier}x
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span>{typeLabels[event.type] || event.type}</span>
                  <span>{formatDateRange(event.startsAt, event.endsAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-blue-700">Upcoming</h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {event.description}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                    {event.multiplier}x
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Starts: {new Date(event.startsAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
