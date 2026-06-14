import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { JWT_COOKIE, DEV_COOKIE, isAuthEnabled } from "./auth-config";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "evolve-dev-secret-change-in-prod"
);

const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(userId: number): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<{ userId: number } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (typeof payload.uid !== "number") return null;
    return { userId: payload.uid };
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: number) {
  const token = await signSession(userId);
  const store = await cookies();
  store.set(JWT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(JWT_COOKIE);
  store.delete(DEV_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();

  // Always check the JWT session first (real auth)
  const token = store.get(JWT_COOKIE)?.value;
  if (token) {
    const session = await verifySession(token);
    if (session) {
      return db.user.findUnique({ where: { id: session.userId } });
    }
  }

  // Dev-mode fallback: only honored if auth is disabled
  if (!isAuthEnabled()) {
    const devId = store.get(DEV_COOKIE)?.value;
    if (devId) {
      const parsed = parseInt(devId, 10);
      if (!isNaN(parsed)) {
        return db.user.findUnique({ where: { id: parsed } });
      }
    }
  }

  return null;
}

export async function setDevUser(userId: number) {
  if (isAuthEnabled()) return; // ignored when auth is on
  const store = await cookies();
  store.set(DEV_COOKIE, String(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}