import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { BarChart3, Settings, ClipboardList, Shield, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            Admin · Workplace Team
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
        </div>
      </div>

      <nav className="flex gap-1 border-b border-slate-200">
        <AdminTab href="/admin/dashboard" icon={<BarChart3 className="w-4 h-4" />}>
          Dashboard
        </AdminTab>
        <AdminTab href="/admin/bookings" icon={<ClipboardList className="w-4 h-4" />}>
          All bookings
        </AdminTab>
        <AdminTab href="/admin/override" icon={<Wrench className="w-4 h-4" />}>
          Override
        </AdminTab>
        <AdminTab href="/admin/rules" icon={<Settings className="w-4 h-4" />}>
          Rules
        </AdminTab>
      </nav>

      <div>{children}</div>
    </div>
  );
}

function AdminTab({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-b-2 border-transparent hover:border-slate-300 transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}