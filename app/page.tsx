import { getCurrentUser } from "@/lib/session";
import Link from "next/link";
import { NetworkStatus } from "@/components/NetworkStatus";
import { NextBooking } from "@/components/NextBooking";
import { TenureBadge } from "@/components/TenureBadge";
import { tenureLabel } from "@/lib/tenure";
import { Zap, ArrowRight, CalendarPlus, History, Wifi } from "lucide-react";
import { PendingTransfers } from "@/components/PendingTransfers";
import { SimulatorCard } from "@/components/SimulatorCard";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
          <Zap className="w-8 h-8 text-primary" strokeWidth={2} />
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          Energize the future,<br />
          <span className="text-primary">reinvented.</span>
        </h1>
        <p className="mt-4 text-lg text-slate-500">
          Intelligent EV charging management for the modern workplace.
        </p>
        <p className="mt-12 inline-flex items-center gap-2 text-sm text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
          Select a user from the top right to begin
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium mb-3">
            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
            Welcome back
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            {user.name}
            <TenureBadge joinedAt={user.joinedAt} />
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user.email}
            {user.jobTitle && <> · {user.jobTitle}</>}
            {user.department && <> · {user.department}</>}
          </p>
          {user.joinedAt && (
            <p className="text-xs text-slate-400 mt-0.5">{tenureLabel(user.joinedAt)}</p>
          )}
        </div>
        {user.employeeId && (
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Employee</div>
            <div className="font-mono text-sm font-semibold text-slate-900">{user.employeeId}</div>
          </div>
        )}
      </div>

      <PendingTransfers />

      {/* Network status + next booking row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-stretch">
        <NetworkStatus />
        <NextBooking />
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/availability"
          className="group bg-slate-900 rounded-xl p-5 hover:bg-slate-800 transition-colors"
        >
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-3">
            <CalendarPlus className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
          </div>
          <div className="text-lg font-semibold text-white mb-1">Book a charger</div>
          <div className="text-sm text-slate-400">Live availability across both sites</div>
          <div className="mt-3 inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
            View chargers <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          href="/my-bookings"
          className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors"
        >
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
            <History className="w-5 h-5 text-slate-600" strokeWidth={2.5} />
          </div>
          <div className="text-lg font-semibold text-slate-900 mb-1">My bookings</div>
          <div className="text-sm text-slate-500">Track reservations and history</div>
          <div className="mt-3 inline-flex items-center gap-1 text-slate-900 text-sm font-medium group-hover:gap-2 transition-all">
            View bookings <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* RFID card (moved to bottom per request) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Your RFID Badge
            </div>
            <div className="font-mono text-xl font-semibold text-slate-900 tracking-wide">
              {user.rfidTag}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Tap this badge at any charger to start your session
            </div>
          </div>
          <div className="hidden md:flex w-14 h-14 rounded-full bg-emerald-50 border-2 border-primary items-center justify-center">
            <Wifi className="w-6 h-6 text-primary" strokeWidth={2.5} />
          </div>
        </div>
        <SimulatorCard userRfid={user.rfidTag} />
      </div>
    </div>
  );
}