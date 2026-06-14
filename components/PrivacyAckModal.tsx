"use client";

import { useEffect, useRef, useState } from "react";
import { X, Shield, Check } from "lucide-react";

export function PrivacyAckModal({
  open,
  onClose,
  onAccept,
}: {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) {
      setScrolledToBottom(false);
      setConfirmed(false);
    }
  }, [open]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining < 20) setScrolledToBottom(true);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Privacy & Data Use</div>
              <div className="text-xs text-slate-500">Please read before continuing</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-auto px-6 py-5 prose prose-sm prose-slate flex-1"
        >
          <h3 className="text-base font-semibold text-slate-900 mt-0">What we collect</h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            Evolve stores the following information about you for the operation of the
            EV charging service:
          </p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            <li>Profile data: name, email, department, job title, employee ID, joined date</li>
            <li>Vehicle data: make, model, year, registration plate</li>
            <li>RFID badge identifier (used to authenticate at chargers)</li>
            <li>Booking history: date, time, station, connector, status</li>
            <li>Charging session data: timestamps, energy consumed, station identity</li>
          </ul>

          <h3 className="text-base font-semibold text-slate-900 mt-4">How we use it</h3>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            <li>
              <span className="font-semibold">Operational:</span> to manage bookings,
              authorize charging sessions, and prevent double-booking.
            </li>
            <li>
              <span className="font-semibold">Fairness:</span> to enforce the 1-hour-per-user
              daily cap and ensure equitable access.
            </li>
            <li>
              <span className="font-semibold">Sustainability reporting:</span> aggregated energy
              consumption data informs ESG and net-zero reporting.
            </li>
            <li>
              <span className="font-semibold">Administration:</span> Workplace Team admins can
              view all bookings and consumption to manage the service.
            </li>
          </ul>

          <h3 className="text-base font-semibold text-slate-900 mt-4">Who can access</h3>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            <li>
              <span className="font-semibold">You:</span> full access to your own bookings,
              sessions, and consumption history.
            </li>
            <li>
              <span className="font-semibold">Other employees:</span> can see that a charger is
              booked at a time, with the booking holder's name. They cannot see your
              consumption data.
            </li>
            <li>
              <span className="font-semibold">Workplace Team admins:</span> can see all
              bookings, energy consumption, and the user-to-vehicle association for the
              purpose of running the service.
            </li>
            <li>
              <span className="font-semibold">Charging station (CSMS):</span> receives your
              RFID identifier to authorize charging sessions.
            </li>
          </ul>

          <h3 className="text-base font-semibold text-slate-900 mt-4">Retention</h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            Operational data is retained for the duration of your employment plus 12 months
            for audit purposes. Aggregated and anonymized consumption data may be retained
            indefinitely for sustainability reporting.
          </p>

          <h3 className="text-base font-semibold text-slate-900 mt-4">Your rights</h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            You may request a copy of your data, request corrections to inaccurate data, or
            request deletion of your account at any time by contacting the Workplace Team.
            Deletion of your account does not affect the aggregated consumption data already
            included in sustainability reports.
          </p>

          <h3 className="text-base font-semibold text-slate-900 mt-4">Changes</h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            We may update this notice as the service evolves. Material changes will be
            communicated in-app and you will be asked to re-acknowledge.
          </p>

          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-600 italic m-0">
              By acknowledging, you confirm that you have read and understood how Evolve
              handles your data. This acknowledgement is recorded with a timestamp on your
              account.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 space-y-3">
          {!scrolledToBottom && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
              Scroll to the bottom to enable acknowledgement.
            </div>
          )}
          <label className={`flex items-start gap-2 text-sm ${scrolledToBottom ? "text-slate-700" : "text-slate-400"}`}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={!scrolledToBottom}
              className="mt-1"
            />
            <span>I have read and understood the data use policy above.</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={!confirmed}
              className="flex-1 px-4 py-2 bg-primary hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              I acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}