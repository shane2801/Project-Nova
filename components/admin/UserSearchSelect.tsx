"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";

type User = { id: number; name: string; employeeId: string | null };

export function UserSearchSelect({
  users,
  value,
  onChange,
}: {
  users: User[];
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selected = value ? users.find((u) => u.id === value) : null;
  const filtered = users
    .filter((u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      (u.employeeId?.toLowerCase().includes(query.toLowerCase()) ?? false)
    )
    .slice(0, 20);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="bg-white border border-slate-300 rounded-lg text-xs px-3 py-1.5 flex items-center gap-2 min-w-[200px] hover:bg-slate-50"
      >
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="flex-1 text-left truncate">
          {selected ? selected.name : "Search user…"}
        </span>
        {selected ? (
          <X
            className="w-3.5 h-3.5 text-slate-500 hover:text-slate-900"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or employee ID…"
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400">No matches.</div>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onChange(u.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${
                    value === u.id ? "bg-emerald-50" : ""
                  }`}
                >
                  <span className="text-slate-900">{u.name}</span>
                  {u.employeeId && (
                    <span className="font-mono text-[10px] text-slate-500">{u.employeeId}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}