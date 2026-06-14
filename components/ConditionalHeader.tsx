"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";
import { UserSwitcher } from "@/components/UserSwitcher";
import { NotificationBell } from "@/components/NotificationBell";

const HIDE_ON = ["/login", "/signup"];

export function ConditionalHeader({
  userId,
  userName,
  userRole,
}: {
  userId: number | null;
  userName: string | null;
  userRole: string | null;
}) {
  const pathname = usePathname();
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <header className="bg-slate-900 border-b-[3px] border-primary">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-slate-900" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-white">Evolve</span>
          <span className="text-[11px] text-slate-400 uppercase tracking-widest ml-1 hidden sm:inline">
            EV Platform
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/availability">Book</NavLink>
          <NavLink href="/my-bookings">My bookings</NavLink>
          {userRole === "admin" && <NavLink href="/admin">Admin</NavLink>}
{userId && (
  <div className="ml-2">
    <NotificationBell />
  </div>
)}
<div className="ml-4 pl-4 border-l border-slate-700">
  <UserSwitcher currentUserId={userId} currentUserName={userName} />
</div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
    >
      {children}
    </Link>
  );
}