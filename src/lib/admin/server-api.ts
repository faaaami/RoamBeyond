import "server-only";

/**
 * The Django admin API. Only this server calls it (Server Components, Server
 * Actions, Route Handlers), so the address can be private and tokens never
 * reach the browser.
 */
const API_ORIGIN = (process.env.ADMIN_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export function adminApiUrl(path: string): string {
  return `${API_ORIGIN}/api/admin/${path.replace(/^\/+/, "")}`;
}
