import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup"];
const PUBLIC_API_PREFIXES = [
  "/api/auth/",
  "/api/csms/network-status",
  "/_next/",
  "/favicon",
];

export function proxy(req: NextRequest) {
  const authEnabled = process.env.EVOLVE_AUTH_MODE === "enabled";
  if (!authEnabled) return NextResponse.next();

  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Any file with a static extension is public (images, fonts, etc.)
  if (/\.(jpeg|jpg|png|gif|webp|svg|ico|woff2?|ttf|otf)$/i.test(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("evolve_session");
  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};