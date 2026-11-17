import "server-only";
import { cookies } from "next/headers";

/**
 * The staff session lives in two httpOnly cookies, so the tokens are never
 * readable by JavaScript in the browser (no XSS token theft):
 *
 *   rb_admin_access   15-minute JWT access token, sent to Django as a Bearer token
 *   rb_admin_refresh  refresh token; rotated by Django on every refresh
 *
 * Cookies can only be written in Server Actions and Route Handlers, so pages
 * that find an expired access token redirect to /auth/refresh, which rotates
 * the tokens and sends the visitor back.
 */

export const ACCESS_COOKIE = "rb_admin_access";
export const REFRESH_COOKIE = "rb_admin_refresh";
/** Present when the user ticked "Keep me signed in": refresh cookie outlives the browser. */
export const REMEMBER_COOKIE = "rb_admin_remember";

/** Renew this many seconds before the access token really expires, to absorb clock skew. */
const EXPIRY_MARGIN_SECONDS = 30;

const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/admin",
};

/** Seconds since the epoch at which a JWT expires, read without verifying it. */
export function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** The access token if it is present and not about to expire. Django still verifies it. */
export function usableAccessToken(token: string | undefined): string | null {
  if (!token) return null;
  const exp = tokenExpiry(token);
  return exp !== null && exp - EXPIRY_MARGIN_SECONDS > Date.now() / 1000 ? token : null;
}

export async function readSession() {
  const store = await cookies();
  return {
    access: store.get(ACCESS_COOKIE)?.value,
    refresh: store.get(REFRESH_COOKIE)?.value,
    remember: store.has(REMEMBER_COOKIE),
  };
}

/** Store a fresh token pair. Only callable from a Server Action or Route Handler. */
export async function writeSession(tokens: { access: string; refresh: string }, remember: boolean) {
  const store = await cookies();
  const now = Math.floor(Date.now() / 1000);
  const accessExp = tokenExpiry(tokens.access) ?? now + 15 * 60;
  const refreshExp = tokenExpiry(tokens.refresh) ?? now + 7 * 24 * 3600;

  store.set(ACCESS_COOKIE, tokens.access, { ...baseCookie, maxAge: Math.max(accessExp - now, 0) });
  // Without "remember", the refresh cookie is a session cookie: closing the browser signs out.
  store.set(REFRESH_COOKIE, tokens.refresh, {
    ...baseCookie,
    ...(remember ? { maxAge: Math.max(refreshExp - now, 0) } : {}),
  });
  if (remember) {
    store.set(REMEMBER_COOKIE, "1", { ...baseCookie, maxAge: Math.max(refreshExp - now, 0) });
  } else {
    store.delete(REMEMBER_COOKIE);
  }
}

export async function clearSession() {
  const store = await cookies();
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, REMEMBER_COOKIE]) store.delete(name);
}

/**
 * Only paths inside this app are allowed as post-login destinations, so a
 * crafted ?next= link cannot send staff to another site.
 */
export function safeNext(next: string | null | undefined, fallback = "/admin"): string {
  if (
    !next ||
    !next.startsWith("/admin") ||
    next.startsWith("//") ||
    next.includes("\\") ||
    next.startsWith("/admin/login") ||
    next.startsWith("/admin/auth/")
  ) {
    return fallback;
  }
  return next;
}
