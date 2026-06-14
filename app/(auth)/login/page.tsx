"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, ArrowRight, Mail, Lock, Eye, EyeOff, MapPin, Cpu, Leaf, Lightbulb } from "lucide-react";
import { LiveNetworkPreview } from "@/components/LiveNetworkPreview";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
  <div className="min-h-screen bg-slate-950 relative overflow-hidden">
    {/* LEFT-PANE IMAGE — covers ~55% width with a 4% bleed past the form edge */}
    <div className="absolute inset-y-0 left-[15%] w-[69%] hidden lg:block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/login-1.jpeg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Soft fade on the right edge so the image blends into the dark form area */}
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-r from-transparent to-slate-950 pointer-events-none" />
    </div>

    {/* Constellation overlay — only over the image area */}
    <div className="absolute inset-y-0 left-0 w-[59%] hidden lg:block pointer-events-none">
      <Constellation />
    </div>

    {/* Emerald accent glow behind the form */}
    <div className="absolute top-1/3 right-[10%] w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

    {/* Subtle dot pattern on the right pane only */}
    <div
      className="absolute inset-y-0 right-0 w-[45%] opacity-[0.04] hidden lg:block"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(167, 9, 234, 0.4) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />

    {/* MAIN GRID */}
    <div className="relative z-10 min-h-screen grid lg:grid-cols-[1fr_1fr]">
      {/* LEFT — copy & insight */}
      <div className="hidden lg:flex flex-col px-12 py-10">
        {/* Logo at top */}
        <div className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 bg-primary/20 border border-primary/50 rounded-lg flex items-center justify-center backdrop-blur-md">
            <Zap className="w-5 h-5 text-primary" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-xl leading-none">Nova</div>
            <div className="text-[10px] text-slate-300 uppercase tracking-widest mt-1">
              EV Charging Platform
            </div>
          </div>
        </div>

        {/* Hero copy + insight stack, vertically centered */}
        <div className="flex-1 flex flex-col justify-start max-w-md space-y-4 mt-24">
          <div>
            <div className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-3">
              The Future of Workplace EV Charging
            </div>
           <h1 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-2xl whitespace-nowrap">
  Reserve. <span className="text-primary">Charge.</span> Go.
</h1>
            {/* <p className="text-slate-200 mt-5 text-base leading-relaxed drop-shadow-lg">
              The Future of Workplace EV Charging
            </p> */}
          </div>

          <div className="bg-emerald-500/10 border border-emerald-400/40 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 text-primary" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-1">
                  Live Network Insight
                </div>
                <LiveNetworkPreview />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md mt-8">
          <FeaturePill icon={<MapPin className="w-4 h-4" />} label="Fair Access" />
          <FeaturePill icon={<Cpu className="w-4 h-4" />} label="Real-Time Visibility" />
          <FeaturePill icon={<Leaf className="w-4 h-4" />} label="Live Consumption Data" />
        </div>
      </div>

      {/* RIGHT — form pane */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
            </div>
            <div className="font-bold text-xl">Evolve</div>
          </div>

          <div className="bg-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 lg:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                Welcome Back
                <Zap className="w-6 h-6 text-primary" />
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Sign in to continue to Nova
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
                    placeholder="you@accenture.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-3 bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={handleForgot}
                    className="text-xs text-primary hover:text-emerald-300 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-emerald-400 text-slate-950 font-semibold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Sign In
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-8">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary font-semibold hover:text-emerald-300">
                Sign up
              </Link>
            </p>
          </div>

          <div className="text-xs text-slate-500 text-center mt-6">
            © 2026 Nova · Accenture Mauritius
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 p-3 bg-slate-900/40 border border-white/10 rounded-xl backdrop-blur-xl">
      <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="text-[10px] text-slate-200 leading-tight">{label}</div>
    </div>
  );
}

function Constellation() {
  const nodes = [
    { x: 8, y: 12 }, { x: 22, y: 8 }, { x: 35, y: 18 }, { x: 14, y: 30 },
    { x: 42, y: 32 }, { x: 28, y: 42 }, { x: 60, y: 14 }, { x: 75, y: 22 },
    { x: 85, y: 35 }, { x: 65, y: 45 }, { x: 50, y: 55 }, { x: 80, y: 60 },
    { x: 18, y: 55 }, { x: 30, y: 70 }, { x: 70, y: 80 }, { x: 92, y: 75 },
    { x: 45, y: 85 }, { x: 15, y: 88 }, { x: 55, y: 25 }, { x: 38, y: 60 },
  ];

  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 6], [6, 7], [7, 8], [8, 11], [11, 14], [14, 15],
    [0, 3], [3, 4], [4, 5], [5, 12], [12, 13], [13, 17], [17, 16],
    [4, 10], [10, 19], [19, 16], [2, 18], [18, 9], [9, 10],
  ];

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="rgb(16 185 129)"
          strokeWidth="0.08"
          strokeOpacity="0.35"
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="0.8" fill="rgb(52 211 153)" opacity="0.2" />
          <circle cx={n.x} cy={n.y} r="0.4" fill="rgb(52 211 153)" opacity="0.9">
            <animate
              attributeName="opacity"
              values="0.4;1;0.4"
              dur={`${3 + (i % 3)}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}
    </svg>
  );
}