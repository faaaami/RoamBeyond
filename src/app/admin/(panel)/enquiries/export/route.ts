import { type NextRequest } from "next/server";
import { adminApiUrl } from "@/lib/admin/server-api";
import { readSession, usableAccessToken } from "@/lib/admin/session";

/**
 * GET /enquiries/export?view=&kind=&q= : downloads the CSV from the API with
 * the signed-in user's token (the browser never holds the token itself).
 */
export async function GET(request: NextRequest) {
  const { access } = await readSession();
  const token = usableAccessToken(access);
  if (!token) {
    const back = `/admin/enquiries${request.nextUrl.search}`;
    return Response.redirect(new URL(`/admin/auth/refresh?next=${encodeURIComponent(back)}`, request.url));
  }
  const res = await fetch(adminApiUrl(`enquiries/export/${request.nextUrl.search}`), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return new Response("The export could not be created. Please try again.", { status: res.status });
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "text/csv; charset=utf-8",
      "Content-Disposition": res.headers.get("Content-Disposition") ?? 'attachment; filename="enquiries.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
