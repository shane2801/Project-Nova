"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";

type User = { id: number; name: string; role: string; email?: string };

export function UserSwitcher({
  currentUserId,
  currentUserName,
}: {
  currentUserId: number | null;
  currentUserName: string | null;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((d) => setAuthEnabled(d.authEnabled))
      .catch(() => setAuthEnabled(false));
  }, []);

  useEffect(() => {
    if (authEnabled === false) {
      // Only load the user list when dev mode is on
      fetch("/api/dev/users").then((r) => r.json()).then(setUsers).catch(() => setUsers([]));
    }
  }, [authEnabled]);

  async function switchTo(id: number) {
    const res = await fetch("/api/auth/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    if (res.ok) window.location.reload();
  }

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

  const initials = currentUserName
    ? currentUserName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  if (!currentUserId) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:bg-slate-800 px-2 py-1.5 rounded-md transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-primary text-slate-900 flex items-center justify-center font-semibold text-xs">
          {initials}
        </div>
        <span className="text-sm text-white">{currentUserName ?? "Account"}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1 max-h-[80vh] overflow-y-auto">
            {/* My account */}
            <button
              onClick={() => { setOpen(false); router.push("/account"); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              My account
            </button>

            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>

            {/* Dev mode user switcher */}
            {authEnabled === false && users.length > 0 && (
              <>
                <div className="border-t border-slate-200 mt-1 pt-1">
                  <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                    Switch user (dev mode)
                  </div>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => switchTo(u.id)}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center justify-between ${
                        u.id === currentUserId ? "bg-emerald-50 text-emerald-900" : "text-slate-700"
                      }`}
                    >
                      <span>{u.name}</span>
                      {u.role === "admin" && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          ADMIN
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}