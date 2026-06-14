import { getCurrentUser } from "@/lib/session";
import Link from "next/link";
import { TenureBadge } from "@/components/TenureBadge";
import { tenureLabel } from "@/lib/tenure";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <div className="py-24 text-center text-slate-500">Not signed in.</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
          My account
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          {user.name}
          <TenureBadge joinedAt={user.joinedAt} />
        </h1>
        <p className="text-sm text-slate-500 mt-1">{user.email}</p>
      </div>

<div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
  <Detail label="Job title" value={user.jobTitle ?? "—"} />
  <Detail label="Department" value={user.department ?? "—"} />
  <Detail label="Employee ID" value={user.employeeId ?? "—"} mono />
  <Detail label="RFID tag" value={user.rfidTag} mono />
  <Detail label="Joined Accenture" value={
    user.joinedAt
      ? new Date(user.joinedAt).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })
      : "—"
  } />
  {user.joinedAt && <Detail label="Tenure" value={tenureLabel(user.joinedAt)} />}
  <Detail label="Role" value={user.role === "admin" ? "Administrator" : "Standard user"} />
  <Detail label="Privacy acknowledged" value={
    user.privacyAckAt
      ? new Date(user.privacyAckAt).toLocaleDateString()
      : "Not on record"
  } />
</div>

<div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Vehicle</div>
  <Detail label="Make" value={user.carMake ?? "—"} />
  <Detail label="Model" value={user.carModel ?? "—"} />
  <Detail label="Year" value={user.carYear ? String(user.carYear) : "—"} />
  <Detail label="Plate" value={user.carPlate ?? "—"} mono />
</div>

      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-900"
      >
        ← Back to home
      </Link>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-medium text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}