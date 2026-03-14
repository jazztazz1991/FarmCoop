"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/fetch";
import Link from "next/link";
import Image from "next/image";

interface HeaderProps {
  user: {
    displayName: string;
    avatarUrl: string | null;
  };
}

export default function Header({ user }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications/unread")
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => setUnreadCount(data.count));

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetch("/api/notifications/unread")
        .then((res) => (res.ok ? res.json() : { count: 0 }))
        .then((data) => setUnreadCount(data.count));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-end px-6 gap-4">
      <Link
        href="/dashboard/notifications"
        className="relative text-gray-400 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
      <div className="flex items-center gap-3">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.displayName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-white">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm text-gray-300">{user.displayName}</span>
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Sign out
      </button>
    </header>
  );
}
