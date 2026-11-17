import { NextResponse, type NextRequest } from "next/server";
import { postJson } from "@/lib/admin/api";
import { clearSession, readSession, safeNext, writeSession } from "@/lib/admin/session";

/**
 * GET /auth/refresh?next=/packages/...
 *
 * Pages cannot write cookies, so a page that finds an expired access token
 * sends the browser here. This rotates the token pair with Django and
 * redirects back; if the refresh token is gone or revoked, it signs out.
 */
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const session = await readSession();

  if (session.refresh) {
    const result = await postJson<{ access: string; refresh: string }>("auth/refresh/", {
      refresh: session.refresh,
    });
    if (result.ok) {
      await writeSession(result.data, session.remember);
      return NextResponse.redirect(new URL(next, request.url));
    }
    if (result.status >= 500) {
      // Django is down: keep the session and show the error page rather than signing out.
      return NextResponse.json(
        { error: "The server is unavailable. Please try again shortly.", code: "unreachable" },
        { status: 503 },
      );
    }
  }

  await clearSession();
  const login = new URL("/admin/login", request.url);
  login.searchParams.set("reason", "expired");
  login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}
