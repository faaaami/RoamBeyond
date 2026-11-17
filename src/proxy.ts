import { NextResponse, type NextRequest } from "next/server";

/**
 * Admin routing, based only on whether a session cookie exists. It verifies
 * nothing: every admin request is checked by Django with the JWT, and the
 * panel's layout sends non-staff visitors to the public site. Only /admin
 * paths pass through here, so the public website is unaffected.
 */
const REFRESH_COOKIE = "rb_admin_refresh";

export function proxy(request: NextRequest) {
  const signedIn = request.cookies.has(REFRESH_COOKIE);
  const { pathname, search } = request.nextUrl;

  if (pathname === "/admin/login") {
    return signedIn ? NextResponse.redirect(new URL("/admin", request.url)) : privately(NextResponse.next());
  }
  if (!signedIn) {
    const login = new URL("/admin/login", request.url);
    if (pathname !== "/admin") login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }
  return privately(NextResponse.next());
}

/** Admin pages are never cached by shared caches and never indexed. */
function privately(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
