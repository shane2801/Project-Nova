"use client";

import { usePathname } from "next/navigation";
import { TimeMachine } from "./TimeMachine";

const HIDE_ON = ["/login", "/signup"];

export function ConditionalTimeMachine() {
  const pathname = usePathname();
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;
  return <TimeMachine />;
}