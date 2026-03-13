"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ActiveEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  multiplier: number;
  endsAt: string;
}

export default function EventBanner({ serverId }: { serverId?: string }) {
  const [events, setEvents] = useState<ActiveEvent[]>([]);

  useEffect(() => {
    if (!serverId) return;
    fetch(`/api/servers/${serverId}/events?view=active`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setEvents);
  }, [serverId]);

  if (events.length === 0) return null;

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <Link
          key={event.id}
          href="/dashboard/events"
          className="block bg-gradient-to-r from-green-900 to-emerald-800 border border-green-700 rounded-lg p-4 hover:from-green-800 hover:to-emerald-700 transition-colors"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-green-300">ACTIVE EVENT</p>
              <p className="text-white font-semibold">{event.title}</p>
              <p className="text-sm text-green-200 mt-1">{event.description}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-green-300">
                {event.multiplier}x
              </span>
              <p className="text-xs text-green-400 mt-1">
                Ends {new Date(event.endsAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
