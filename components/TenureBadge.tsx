import { tenureTier, tenureLabel } from "@/lib/tenure";
import { Award } from "lucide-react";

const config = {
  bronze: {
    bg: "bg-gradient-to-br from-amber-100 to-amber-200",
    border: "border-amber-300",
    icon: "text-amber-700",
    text: "text-amber-900",
    label: "Bronze",
  },
  silver: {
    bg: "bg-gradient-to-br from-slate-200 to-slate-300",
    border: "border-slate-400",
    icon: "text-slate-700",
    text: "text-slate-900",
    label: "Silver",
  },
  gold: {
    bg: "bg-gradient-to-br from-yellow-100 to-yellow-300",
    border: "border-yellow-500",
    icon: "text-yellow-800",
    text: "text-yellow-900",
    label: "Gold",
  },
} as const;

export function TenureBadge({ joinedAt }: { joinedAt: Date | string | null | undefined }) {
  const tier = tenureTier(joinedAt);
  if (!tier) return null;

  const c = config[tier];
  return (
    <span
      title={tenureLabel(joinedAt)}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.border} ${c.text}`}
    >
      <Award className={`w-3 h-3 ${c.icon}`} strokeWidth={2.5} />
      {c.label}
    </span>
  );
}