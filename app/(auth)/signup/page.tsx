"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Loader2, Check, User, Mail, Lock, Briefcase, Calendar, Car, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { PrivacyAckModal } from "@/components/PrivacyAckModal";
import { SignupStepIndicator } from "@/components/SignupStepIndicator";
import { EV_MAKES, modelsForMake } from "@/lib/ev-catalog";

const STEPS = [
  { id: 1, label: "About you" },
  { id: 2, label: "Work profile" },
  { id: 3, label: "Your vehicle" },
  { id: 4, label: "Privacy" },
];

export default function SignupPage() {
  const [step, setStep] = useState(1);
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
  const [showPassword, setShowPassword] = useState(false);
  const [privacyAck, setPrivacyAck] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!form.name.trim()) return "Full name is required.";
      if (!form.email.trim()) return "Email is required.";
      if (form.password.length < 6) return "Password must be at least 6 characters.";
    }
    // Steps 2 and 3 are all optional fields, no validation
    if (s === 4 && !privacyAck) return "You must acknowledge the privacy notice.";
    return null;
  }

  function nextStep() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(STEPS.length, s + 1));
  }

  function prevStep() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit() {
    const err = validateStep(4);
    if (err) {
      setError(err);
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
    window.location.href = "/";
  }

  const currentYear = new Date().getFullYear();
  const availableModels = modelsForMake(form.carMake);

  return (
    <>
      <div className="min-h-screen bg-white grid lg:grid-cols-[1fr_1.1fr]">
        {/* LEFT — hero pane (no overlay) */}
        <div className="relative hidden lg:flex flex-col px-12 py-10 overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/signup.jpeg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-xl text-slate-900 leading-none">Nova</div>
              <div className="text-[10px] text-slate-700 uppercase tracking-widest mt-1">
                EV Charging Platform
              </div>
            </div>
          </div>

          {/* Hero copy */}
          <div className="relative z-10 max-w-md mt-32 flex-1">
            {/* <div className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-3">
              Get started
            </div> */}
            <h1 className="text-4xl font-bold text-slate-900 leading-tight tracking-tight">
              Join the <span className="text-primary">charging network.</span>
            </h1>
            <p className="text-slate-800 mt-4 text-base leading-relaxed">
              Set up your profile, register your vehicle, and start booking chargers
              across both sites.
            </p>

            <div className="mt-8 space-y-3">
              {STEPS.map((s) => (
                <Step key={s.id} n={String(s.id)} title={s.label} active={s.id === step} />
              ))}
            </div>
          </div>

          <div className="relative z-10 text-xs text-slate-600">
            © 2026 Nova · Accenture Mauritius
          </div>
        </div>

        {/* RIGHT — form pane */}
        <div className="flex items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
          <div className="w-full max-w-lg my-4">
            <div className="lg:hidden mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="font-bold text-lg text-slate-900">Nova</div>
            </div>

            <div className="mb-6">
              <h2 className="text-3xl xl:text-4xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
                Create your account
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Join Nova and start your electric journey.
              </p>
            </div>

            <SignupStepIndicator steps={STEPS} currentStep={step} />

            {/* STEP CONTENT */}
            <div className="space-y-4 min-h-[280px]">
              {step === 1 && (
                <>
                  <Field label="Full name" required icon={<User className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      required
                      className="input-style pl-10"
                      placeholder="John Doe"
                    />
                  </Field>
                  <Field label="Email address" required icon={<Mail className="w-4 h-4" />}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      required
                      className="input-style pl-10"
                      placeholder="you@accenture.com"
                    />
                  </Field>
                 <Field label="Password" required icon={<Lock className="w-4 h-4" />}>
  <>
    <input
      type={showPassword ? "text" : "password"}
      value={form.password}
      onChange={(e) => set("password", e.target.value)}
      required
      minLength={6}
      className="input-style pl-10 pr-10"
      placeholder="Minimum 6 characters"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </>
</Field>
                </>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Department" icon={<Briefcase className="w-4 h-4" />}>
                    <select
                      value={form.department}
                      onChange={(e) => set("department", e.target.value)}
                      className="input-style pl-10 appearance-none cursor-pointer"
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
                      className="input-style px-3.5"
                      placeholder="Software Engineer"
                    />
                  </Field>
                  <Field label="Employee ID">
                    <input
                      type="text"
                      value={form.employeeId}
                      onChange={(e) => set("employeeId", e.target.value)}
                      className="input-style font-mono px-3.5"
                      placeholder="EMP-0123"
                    />
                  </Field>
                  <Field label="Joined Accenture" icon={<Calendar className="w-4 h-4" />}>
                    <input
                      type="date"
                      value={form.joinedAt}
                      onChange={(e) => set("joinedAt", e.target.value)}
                      className="input-style pl-10 px-3.5"
                    />
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Make" icon={<Car className="w-4 h-4" />}>
                    <select
                      value={form.carMake}
                      onChange={(e) => {
                        set("carMake", e.target.value);
                        set("carModel", ""); // reset model when make changes
                      }}
                      className="input-style pl-10 appearance-none cursor-pointer px-3.5"
                    >
                      <option value="">Select make…</option>
                      {EV_MAKES.map((make) => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Model">
                    <select
                      value={form.carModel}
                      onChange={(e) => set("carModel", e.target.value)}
                      disabled={!form.carMake}
                      className="input-style appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed px-3.5"
                    >
                      <option value="">
                        {form.carMake ? "Select model…" : "Select make first"}
                      </option>
                      {availableModels.map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Year">
                    <input
                      type="number"
                      value={form.carYear}
                      onChange={(e) => set("carYear", e.target.value)}
                      className="input-style px-3.5"
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
                      className="input-style font-mono uppercase px-3.5"
                      placeholder="MU 1234 AB"
                    />
                  </Field>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Before we create your account, please review how Nova handles your
                    data and confirm your acknowledgement.
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-4 rounded-xl border-2 transition-colors ${
                      privacyAck
                        ? "border-primary bg-primary/5 text-slate-900"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {privacyAck && <Check className="w-4 h-4 text-primary" />}
                      {privacyAck ? "Privacy notice acknowledged" : "Read & acknowledge privacy notice"}
                    </span>
                    <span className="text-xs text-slate-500">{privacyAck ? "Re-read" : "Required"}</span>
                  </button>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Almost done — review your details
                    </div>
                    <dl className="text-xs space-y-1 text-slate-700">
                      <Row label="Name" value={form.name || "—"} />
                      <Row label="Email" value={form.email || "—"} />
                      <Row label="Department" value={form.department || "—"} />
                      <Row label="Vehicle" value={
                        form.carMake && form.carModel
                          ? `${form.carMake} ${form.carModel}${form.carYear ? ` (${form.carYear})` : ""}`
                          : "—"
                      } />
                    </dl>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* NAV BUTTONS */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              {step < STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={loading || !privacyAck}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create account
                </button>
              )}
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:text-emerald-600">
                Sign in
              </Link>
            </p>
          </div>
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

<style jsx>{`
  :global(.input-style) {
    width: 100%;
    padding-top: 0.625rem;
    padding-bottom: 0.625rem;
    background-color: white;
    border: 1px solid rgb(203 213 225);
    border-radius: 0.75rem;
    font-size: 0.875rem;
    color: rgb(15 23 42);
  }
  :global(.input-style:focus) {
    outline: none;
    border-color: rgb(20 184 116);
    box-shadow: 0 0 0 3px rgb(20 184 116 / 0.15);
  }
  :global(.input-style::placeholder) {
    color: rgb(148 163 184);
  }
`}</style>
    </>
  );
}

function Step({ n, title, active }: { n: string; title: string; active: boolean }) {
  return (
    <div className="flex gap-3 items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
        active
          ? "bg-primary text-white shadow-lg shadow-primary/30"
          : "bg-white/40 border border-slate-400 text-slate-700"
      }`}>
        {n}
      </div>
      <div className={`text-sm font-semibold ${active ? "text-primary" : "text-slate-700"}`}>
        {title}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            {icon}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900 truncate">{value}</dd>
    </div>
  );
}