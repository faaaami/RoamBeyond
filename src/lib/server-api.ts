import "server-only";

/**
 * Where the Next.js server reaches the Django API. API_URL lets the server use
 * an internal address (e.g. http://api:8000 in Docker); otherwise it uses the
 * public NEXT_PUBLIC_API_URL that the browser forms use.
 */
export const SERVER_API_BASE = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000")
).replace(/\/+$/, "");

export function serverApiUrl(path: string): string {
  if (!SERVER_API_BASE) {
    throw new Error("Set API_URL or NEXT_PUBLIC_API_URL to the Django backend.");
  }
  return `${SERVER_API_BASE}/api/v1/${path.replace(/^\/+/, "")}`;
}
