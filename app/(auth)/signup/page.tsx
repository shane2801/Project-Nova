"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, Check } from "lucide-react";
import { PrivacyAckModal } from "@/components/PrivacyAckModal";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    jobTitle: "",
    employeeId: "",
    joinedAt: "",
    carMake: "",
    carModel: "",
    carYear: "",
    carPlate: "",
  });
  const [privacyAck, setPrivacyAck] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!privacyAck) {
      setError("You must acknowledge the privacy notice to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        carYear: form.carYear ? parseInt(form.carYear, 10) : null,
        privacyAck,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Signup failed");
      return;
    }
    // Hard navigate so all server components re-fetch with the new session
    window.location.href = "/";
  }

  const currentYear = new Date().getFullYear();

  return (
    <>
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* LEFT brand pane — same as login but with a different headline */}
        <div className="relative hidden lg:flex flex-col justify-between bg-slate-900 text-white p-12 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          ></div>
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"></div>

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

          <div className="relative space-y-6">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-emerald-400 font-semibold mb-3">
                Get started
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight">
                Join the fair-access<br />charging network.
              </h1>
              <p className="text-slate-400 mt-4 text-base leading-relaxed max-w-md">
                Set up your profile, register your vehicle, and start booking chargers
                across both sites.
              </p>
            </div>

            <div className="space-y-3 max-w-md">
              <Step n="1" title="Tell us about you" desc="Name, email, work profile." />
              <Step n="2" title="Add your vehicle" desc="Make, model, plate." />
              <Step n="3" title="Acknowledge data use" desc="Required, one-time." />
            </div>
          </div>

          <div className="relative flex items-center gap-6 text-xs text-slate-500">
            <span>Privacy by design</span>
            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
            <span>You control your data</span>
          </div>
        </div>

        {/* RIGHT — form pane */}
        <div className="flex items-start justify-center p-6 sm:p-12 bg-white overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <div className="lg:hidden mb-8 flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
              </div>
              <div className="font-bold text-lg text-slate-900">Evolve</div>
            </div>

            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                Create account
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Set up your profile
              </h2>
            </div>

            {/* keep the existing <form ...> block here — don't change it */}

            <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-sm">
              <Section title="About you">
                <Field label="Full name" required>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="you@accenture.com"
                  />
                </Field>
                <Field label="Password" required>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Minimum 6 characters"
                  />
                </Field>
              </Section>

              <Section title="Work profile">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Department">
                    <select
                      value={form.department}
                      onChange={(e) => set("department", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                    >
                      <option value="">Select…</option>
                      <option value="Technology">Technology</option>
                      <option value="Strategy">Strategy</option>
                      <option value="Operations">Operations</option>
                      <option value="Workplace">Workplace</option>
                    </select>
                  </Field>
                  <Field label="Job title">
                    <input
                      type="text"
                      value={form.jobTitle}
                      onChange={(e) => set("jobTitle", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Software Engineer"
                    />
                  </Field>
                  <Field label="Employee ID">
                    <input
                      type="text"
                      value={form.employeeId}
                      onChange={(e) => set("employeeId", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="EMP-0123"
                    />
                  </Field>
                  <Field label="Joined Accenture">
                    <input
                      type="date"
                      value={form.joinedAt}
                      onChange={(e) => set("joinedAt", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Your vehicle">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Make">
                    <input
                      type="text"
                      value={form.carMake}
                      onChange={(e) => set("carMake", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Tesla"
                    />
                  </Field>
                  <Field label="Model">
                    <input
                      type="text"
                      value={form.carModel}
                      onChange={(e) => set("carModel", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Model 3"
                    />
                  </Field>
                  <Field label="Year">
                    <input
                      type="number"
                      value={form.carYear}
                      onChange={(e) => set("carYear", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      min={1990}
                      max={currentYear + 1}
                      placeholder={String(currentYear)}
                    />
                  </Field>
                  <Field label="Registration plate">
                    <input
                      type="text"
                      value={form.carPlate}
                      onChange={(e) => set("carPlate", e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="MU 1234 AB"
                    />
                  </Field>
                </div>
              </Section>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${privacyAck
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {privacyAck && <Check className="w-4 h-4 text-emerald-600" />}
                    {privacyAck ? "Privacy notice acknowledged" : "Read & acknowledge privacy notice"}
                  </span>
                  <span className="text-xs text-slate-500">{privacyAck ? "Re-read" : "Required"}</span>
                </button>
              </div>

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !privacyAck}
                className="w-full bg-primary hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create account
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <PrivacyAckModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onAccept={() => {
            setPrivacyAck(true);
            setModalOpen(false);
          }}
        />
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 block">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
        {n}
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-xs text-slate-400">{desc}</div>
      </div>
    </div>
  );
}