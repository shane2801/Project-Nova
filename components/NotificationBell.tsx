"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, Trash2, Calendar, ArrowRightLeft, Zap, AlertCircle, Wrench, X } from "lucide-react";

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  data: { bookingId?: number; transferId?: number; stationIdentity?: string; byUserName?: string } | null;
  readAt: string | null;
  createdAt: string;
};

const POLL_INTERVAL_MS = 15000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
    const i = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    // Marking all read when the panel opens (Instagram-style)
    if (next && unreadCount > 0) {
      // Optimistically clear badge
      setUnreadCount(0);
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    }
  }

  async function clearAll() {
    if (!confirm("Delete all notifications?")) return;
    setLoading(true);
    await fetch("/api/notifications/clear", { method: "POST" });
    setNotifications([]);
    setUnreadCount(0);
    setLoading(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-full hover:bg-slate-800 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[95vw] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="font-semibold text-slate-900 text-sm">Notifications</div>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                disabled={loading}
                className="text-[11px] text-slate-500 hover:text-red-600 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No notifications yet
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <NotificationRow key={n.id} n={n} onClose={() => setOpen(false)} />
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-slate-50 border-t border-slate-200"
            >
              View all notifications →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ n, onClose }: { n: Notification; onClose: () => void }) {
  const icon = iconFor(n.type);
  const isUnread = !n.readAt;
  const href = hrefFor(n);
  const time = relativeTime(n.createdAt);

  const content = (
    <div
      className={`px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer flex items-start gap-3 ${
        isUnread ? "bg-emerald-50/40" : ""
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${icon.bg}`}>
        {icon.element}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium text-sm text-slate-900 leading-tight">{n.title}</div>
          {isUnread && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"></span>}
        </div>
        <div className="text-xs text-slate-600 mt-0.5 leading-snug">{n.body}</div>
        <div className="text-[10px] text-slate-400 mt-1">{time}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClose}>
        {content}
      </Link>
    );
  }
  return content;
}

export function iconFor(type: string): { bg: string; element: React.ReactNode } {
  switch (type) {
    case "booking_created":
    case "booking_created_by_admin":
      return { bg: "bg-emerald-100", element: <Calendar className="w-4 h-4 text-emerald-700" /> };
    case "booking_cancelled_by_admin":
    case "force_stopped":
      return { bg: "bg-red-100", element: <AlertCircle className="w-4 h-4 text-red-700" /> };
    case "transfer_invited":
    case "transfer_accepted":
    case "transfer_declined":
    case "admin_user_transferred":
      return { bg: "bg-blue-100", element: <ArrowRightLeft className="w-4 h-4 text-blue-700" /> };
    case "session_start_soon":
    case "session_end_soon":
    case "transfer_cutoff":
      return { bg: "bg-amber-100", element: <Zap className="w-4 h-4 text-amber-700" /> };
    case "admin_user_released":
      return { bg: "bg-slate-100", element: <X className="w-4 h-4 text-slate-700" /> };
    case "admin_user_no_show":
      return { bg: "bg-slate-100", element: <Wrench className="w-4 h-4 text-slate-700" /> };
    default:
      return { bg: "bg-slate-100", element: <Bell className="w-4 h-4 text-slate-700" /> };
  }
}

export function hrefFor(n: Notification): string | null {
  if (!n.data) return null;
  if (
    n.data.bookingId &&
    (n.type.startsWith("booking_") ||
      n.type === "force_stopped" ||
      n.type.startsWith("session_") ||
      n.type === "transfer_cutoff")
  ) {
    return "/my-bookings";
  }
  if (n.data.transferId && n.type.startsWith("transfer_")) {
    return "/"; // home shows pending transfers
  }
  if (n.type.startsWith("admin_")) {
    return "/admin/bookings";
  }
  return null;
}

export function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`;
  const diffDay = Math.round(diffSec / 86400);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}