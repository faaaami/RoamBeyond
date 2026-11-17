/**
 * Base URL of the Django API in backend/, without a trailing slash.
 *
 * NEXT_PUBLIC_API_URL is inlined at build time, so set it before `next build`.
 * In development it defaults to the local Django server.
 */
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000")
).replace(/\/+$/, "");

if (!API_URL && process.env.NODE_ENV === "production" && typeof window !== "undefined") {
  console.error("[api] NEXT_PUBLIC_API_URL was not set at build time. Forms cannot be submitted.");
}

/** Absolute URL for an API path such as "/api/v1/enquiries/". */
export function apiUrl(path: string): string {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Error body every API endpoint returns (backend/apps/core/exceptions.py). */
export type ApiErrorBody = {
  error?: string;
  /** Stable machine-readable code, e.g. "invalid", "throttled", "token_not_valid". */
  code?: string;
  /** Matches the X-Request-ID header and the backend logs. Quote it when reporting a problem. */
  requestId?: string;
  fields?: { path: string; message: string }[];
  retryAfter?: number;
};
