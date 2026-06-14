export type TenureTier = "bronze" | "silver" | "gold";

export function tenureYears(joinedAt: Date | string | null | undefined): number | null {
  if (!joinedAt) return null;
  const date = new Date(joinedAt);
  if (isNaN(date.getTime())) return null;
  const now = new Date();
  const ms = now.getTime() - date.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

export function tenureTier(joinedAt: Date | string | null | undefined): TenureTier | null {
  const years = tenureYears(joinedAt);
  if (years === null) return null;
  if (years >= 10) return "gold";
  if (years >= 5) return "silver";
  return "bronze";
}

export function tenureLabel(joinedAt: Date | string | null | undefined): string {
  const years = tenureYears(joinedAt);
  if (years === null) return "";
  const wholeYears = Math.floor(years);
  if (wholeYears === 0) return "Joined this year";
  return `${wholeYears} ${wholeYears === 1 ? "year" : "years"} at Accenture`;
}