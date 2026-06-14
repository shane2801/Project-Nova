import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import { ConditionalMain } from "@/components/ConditionalMain";
import { TimeMachine } from "@/components/TimeMachine";

export const metadata = { title: "Evolve — Intelligent EV Charging" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 antialiased">
        <ConditionalHeader
          userId={user?.id ?? null}
          userName={user?.name ?? null}
          userRole={user?.role ?? null}
        />
        <ConditionalMain>{children}</ConditionalMain>
        <TimeMachine />
      </body>
    </html>
  );
}