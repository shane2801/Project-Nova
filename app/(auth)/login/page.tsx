"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, ArrowRight } from "lucide-react";
import { LiveNetworkPreview } from "@/components/LiveNetworkPreview";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
      return;
    }
    const dest = searchParams.get("from") || "/";
    window.location.href = dest;
  }

  function handleForgot() {
    alert("Contact workplace@accenture.com to reset your password.");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* LEFT — brand pane */}
      <div className="relative hidden lg:flex flex-col justify-between bg-slate-900 text-white p-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-lg leading-none">Evolve</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
              EV Charging Platform
            </div>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-emerald-400 font-semibold mb-3">
              Energizing the future
            </div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Intelligent EV<br />
              charging,<br />
              <span className="text-primary">reinvented.</span>
            </h1>
            <p className="text-slate-400 mt-4 text-base leading-relaxed max-w-md">
              Fair access. Real-time visibility. Live consumption data. Built for the workplace of the next decade.
            </p>
          </div>

          <LiveNetworkPreview />
        </div>

        <div className="relative flex items-center gap-6 text-xs text-slate-500">
          <span>OCPP 1.6J</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full" />
          <span>NEX Tower · NEX Terracom II</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full" />
          <span>Accenture Mauritius</span>
        </div>
      </div>

      {/* RIGHT — form pane */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
            </div>
            <div className="font-bold text-lg text-slate-900">Evolve</div>
          </div>

          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
              Welcome back
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Use your Accenture email and password.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="you@accenture.com"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-[11px] text-slate-500 hover:text-primary bg-transparent border-0 p-0 cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Sign in
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              First time here?{" "}
              <Link href="/signup" className="text-primary font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <p className="text-xs text-slate-400 mt-12">
            By signing in you agree to the data handling described in our privacy notice.
          </p>
        </div>
      </div>
    </div>
  );
}