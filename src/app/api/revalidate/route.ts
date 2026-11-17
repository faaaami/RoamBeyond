import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CONTENT_TAG } from "@/lib/content";

/**
 * POST /api/revalidate
 * Called by the Django backend after an admin edit (backend/apps/core/revalidation.py).
 * Clears the cached content so the next visit shows the change.
 *
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *
 * REVALIDATE_SECRET must equal FRONTEND_REVALIDATE_SECRET in backend/.env.
 * In development it defaults to the same value the backend uses.
 */
const SECRET =
  process.env.REVALIDATE_SECRET ||
  (process.env.NODE_ENV === "production" ? "" : "dev-revalidate-secret");

function authorised(request: NextRequest): boolean {
  if (!SECRET) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${SECRET}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }
  // Expire immediately so the editor sees the change on the next reload.
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
