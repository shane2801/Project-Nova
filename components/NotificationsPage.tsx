"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Trash2, Check, Filter } from "lucide-react";
import { iconFor, hrefFor, relativeTime } from "@/components/NotificationBell";

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  data: any | null;  // string from server, parsed below
  readAt: string | null;
  createdAt: string;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "bookings", label: "Bookings", types: ["booking_created", "booking_created_by_admin", "booking_cancelled_by_admin"] },
  { key: "transfers", label: "Transfers", types: ["transfer_invited", "transfer_accepted", "transfer_declined", "admin_user_transferred"] },
  { key: "sessions", label: "Sessions", types: ["session_start_soon", "session_end_soon", "transfer_cutoff", "force_stopped"] },
  { key: "admin", label: "Admin", types: ["admin_user_released", "admin_user_transferred", "admin_user_no_show", "force_stopped"] },
] as const;

export function NotificationsPage({ initialNotifications }: { initialNotifications: any[] }) {
  // Parse data JSON for each
  const parsed: Notification[] = initialNotifications.map((n) => ({
    ...n,
    data: n.data ? (typeof n.data === "string" ? JSON.parse(n.data) : n.data) : null,
  }));
  const [notifications, setNotifications] = useState<Notification[]>(parsed);
  const [filter, setFilter] = useState<string>("all");
  const [busy, setBusy] = useState(false);

  async function markAllRead() {
    setBusy(true);
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    setNotifications((ns) => ns.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setBusy(false);
  }

  async function clearAll() {
    if (!confirm("Delete all notifications? This cannot be undone.")) return;
    setBusy(true);
    await fetch("/api/notifications/clear", { method: "POST" });
    setNotifications([]);
    setBusy(false);
  }

  const filterCfg = FILTERS.find((f) => f.key === filter);
  const visible = filterCfg && "types" in filterCfg && filterCfg.types
    ? notifications.filter((n) => filterCfg.types!.includes(n.type))
    : notifications;

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Inbox
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {notifications.length} total · {unreadCount} unread
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={busy}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              disabled={busy}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 inline-flex w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === f.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl py-16 text-center">
          <Bell className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">
            {filter === "all" ? "No notifications yet." : `No ${filter} notifications.`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {visible.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ n }: { n: Notification }) {
  const icon = iconFor(n.type);
  const isUnread = !n.readAt;
  const href = hrefFor(n);
  const time = relativeTime(n.createdAt);

  const content = (
    <div
      className={`px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 flex items-start gap-3 ${
        isUnread ? "bg-emerald-50/30" : ""
      }`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${icon.bg}`}>
        {icon.element}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium text-sm text-slate-900">{n.title}</div>
          {isUnread && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"></span>}
        </div>
        <div className="text-sm text-slate-600 mt-1">{n.body}</div>
        <div className="text-xs text-slate-400 mt-1.5">{time}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}