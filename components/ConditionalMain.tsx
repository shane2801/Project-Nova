"use client";

import { usePathname } from "next/navigation";

const FULL_BLEED = ["/login", "/signup"];

export function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = FULL_BLEED.some((p) => pathname.startsWith(p));

  if (isFullBleed) {
    return <main>{children}</main>;
  }
  return <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>;
}