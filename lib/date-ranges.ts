export type RangeKey = "today" | "week" | "month" | "ytd" | "all";

export function dateRange(key: RangeKey): { from: Date | null; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  if (key === "all") {
    return { from: null, to };
  }
  if (key === "today") {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }
  if (key === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }
  if (key === "month") {
    const from = new Date(now);
    from.setDate(now.getDate() - 30);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }
  if (key === "ytd") {
    const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    return { from, to };
  }
  return { from: null, to };
}

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  week: "Last 7 days",
  month: "Last 30 days",
  ytd: "Year to date",
  all: "All time",
};