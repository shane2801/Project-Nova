"use client";

import { Check } from "lucide-react";

type Step = { id: number; label: string };

export function SignupStepIndicator({
  steps,
  currentStep,
}: {
  steps: Step[];
  currentStep: number;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, idx) => {
          const isComplete = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isLast = idx === steps.length - 1;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isComplete
                      ? "bg-primary text-white"
                      : isActive
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isComplete ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>
                <div
                  className={`text-[10px] uppercase tracking-wider font-medium hidden md:block ${
                    isActive ? "text-primary" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </div>
              </div>
              {!isLast && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    isComplete ? "bg-primary" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}