"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

export function BookButton({ stationIdentity, disabled }: { stationIdentity: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function book() {
    if (disabled || loading) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationIdentity }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Booking failed");
      return;
    }
    router.push("/my-bookings");
  }

  return (
    <div>
      <button
        onClick={book}
        disabled={loading || disabled}
        className={`w-full font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${
          disabled
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-primary hover:bg-emerald-600 text-white"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Booking…
          </>
        ) : disabled ? (
          "Not available"
        ) : (
          <>
            Book next hour
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      {error && (
        <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
          {error}
        </div>
      )}
    </div>
  );
}