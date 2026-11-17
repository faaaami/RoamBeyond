import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { adminApiUrl } from "./server-api";
import { readSession, usableAccessToken } from "./session";

/* ---------- Errors (backend/apps/core/exceptions.py) ---------- */

export type ApiErrorBody = {
  error?: string;
  code?: string;
  requestId?: string;
  fields?: { path: string; message: string }[];
  retryAfter?: number;
};

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(body.error ?? `Request failed (${status})`);
    this.name = "AdminApiError";
  }
}

/* ---------- Shared shapes ---------- */

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Option {
  value: string;
  label: string;
}

export interface Options {
  tripTypes: Option[];
  categories: Option[];
  budgets: Option[];
  enquiryStatuses: Option[];
  enquiryKinds: Option[];
  destinations: Option[];
  staff: Option[];
  roles: Option[];
}

/* ---------- Auth ---------- */

export interface StaffUser {
  id: number;
  username: string;
  email: string;
  name: string;
  isSuperuser: boolean;
  lastLogin: string | null;
}

export interface Section {
  key: string;
  title: string;
  group: string;
  icon: string;
  singleton: boolean;
  permissions: { view: boolean; add: boolean; change: boolean; delete: boolean };
}

export interface Me extends StaffUser {
  sections: Section[];
}

/* ---------- Stats and activity ---------- */

export interface ActivityEvent {
  kind: "edit" | "enquiry";
  action: "added" | "changed" | "deleted" | "received";
  who: string;
  what: string;
  section: string;
  detail: string;
  link: string | null;
  at: string;
}

export interface Stats {
  totals: { key: string; title: string; icon: string; count: number }[];
  counts: {
    new: number;
    due: number;
    mine: number;
    unassigned: number;
    thisWeek: number;
    convertedThisMonth: number;
    emailFailed: number;
  } | null;
  byStatus: { status: EnquiryStatus; label: string; count: number }[];
  topPackages: { name: string; slug: string; count: number }[];
  recentEnquiries: EnquirySummary[];
  activity: ActivityEvent[];
}

/* ---------- Enquiries ---------- */

export type EnquiryStatus = "new" | "contacted" | "converted" | "closed";
export type EnquiryKind = "callback" | "package" | "custom";

export interface EnquirySummary {
  reference: string;
  kind: EnquiryKind;
  kindLabel: string;
  status: EnquiryStatus;
  statusLabel: string;
  name: string;
  mobile: string;
  email: string;
  summary: string;
  assignedTo: { id: number; name: string } | null;
  followUpOn: string | null;
  createdAt: string;
}

export interface EnquiryDetail extends EnquirySummary {
  /** Statuses this lead may be set to now; the current one is included. */
  allowedStatuses: { value: string; label: string }[];
  message: string;
  packageName: string;
  packageSlug: string;
  departureCity: string;
  destination: string;
  travelDate: string | null;
  duration: string;
  budget: string;
  tripTypeLabel: string;
  adults: number | null;
  children: number | null;
  internalNotes: string;
  leadSource: { page: string; referrer: string; utmSource: string; utmMedium: string; utmCampaign: string };
  notifiedAt: string | null;
  notificationError: string;
  acknowledgedAt: string | null;
  updatedAt: string;
}

/* ---------- Catalog ---------- */

export interface Destination {
  id: number;
  name: string;
  slug: string;
  region: string;
  tagline: string;
  description: string;
  bestSeason: string;
  knownFor: string[];
  image: string;
  popular: boolean;
  isPublished: boolean;
  sortOrder: number;
  packageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PackageSummary {
  id: number;
  name: string;
  slug: string;
  destination: number;
  destinationName: string;
  days: number;
  nights: number;
  priceFrom: number | null;
  category: string;
  categoryLabel: string;
  budget: string;
  featured: boolean;
  isPublished: boolean;
  sortOrder: number;
  cover: string;
  updatedAt: string;
}

export interface TourPackage extends Omit<PackageSummary, "categoryLabel"> {
  tripTypes: string[];
  summary: string;
  overview: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  startCity: string;
  endCity: string;
  bestSeason: string;
  groupSize: string;
  stay: string;
  transport: string;
  coverAlt: string;
  itinerary: { id: number; title: string; description: string; meals: string; stay: string }[];
  photos: { id: number; image: string; alt: string }[];
  createdAt: string;
}

export interface Review {
  id: number;
  text: string;
  name: string;
  trip: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface NavLink {
  id: number;
  label: string;
  href: string;
  position: number;
  isPublished: boolean;
  updatedAt: string;
}

export interface PageSeo {
  id: number;
  path: string;
  title: string;
  description: string;
  updatedAt: string;
}

export interface TripTypeInfo {
  id: number;
  code: string;
  label: string;
  blurb: string;
  position: number;
  updatedAt: string;
}

export interface PhotoCredit {
  id: number;
  title: string;
  author: string;
  licence: string;
  source: string;
  usedFor: string;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Website pages ---------- */

export type PageRecord = Record<string, unknown> & { updatedAt: string };

export interface LegalPage {
  id: number;
  kind: "privacy" | "terms";
  kindLabel: string;
  title: string;
  intro: string;
  lastUpdated: string;
  hideTemplateNotice: boolean;
  sections: { id: number; heading: string; body: string }[];
  updatedAt: string;
}

/* ---------- Staff accounts ---------- */

export interface StaffAccount {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  isSuperuser: boolean;
  roles: number[];
  roleNames: string[];
  lastLogin: string | null;
  dateJoined: string;
}

export interface Role {
  id: number;
  name: string;
  sections: string[];
  memberCount: number;
}

/* ---------- Requests ---------- */

/** The visitor's IP, forwarded so Django's per-IP login throttle sees them, not this server. */
export async function clientIpHeaders(): Promise<Record<string, string>> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "";
  return ip ? { "X-Forwarded-For": ip } : {};
}

type Result<T> = { ok: true; data: T } | { ok: false; status: number; error: ApiErrorBody };

/** Unauthenticated JSON call used by sign-in, refresh and sign-out. */
export async function postJson<T>(path: string, body: unknown): Promise<Result<T>> {
  let res: Response;
  try {
    res = await fetch(adminApiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...(await clientIpHeaders()) },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 503, error: { error: "We could not reach the server. Please try again.", code: "unreachable" } };
  }
  if (res.status === 204) return { ok: true, data: undefined as T };
  const json = (await res.json().catch(() => ({}))) as T & ApiErrorBody;
  return res.ok ? { ok: true, data: json } : { ok: false, status: res.status, error: json };
}

/**
 * Authenticated GET (or other call) from a Server Component. `returnTo` is the
 * page to come back to after a token refresh: an expired access token
 * redirects to /auth/refresh, which never returns here.
 */
export async function adminFetch<T>(
  path: string,
  { returnTo, method = "GET", body }: { returnTo: string; method?: string; body?: unknown },
): Promise<T> {
  // Request-time only: token expiry is compared with the current time.
  await connection();
  const { access } = await readSession();
  const token = usableAccessToken(access);
  if (!token) redirect(`/admin/auth/refresh?next=${encodeURIComponent(returnTo)}`);

  let res: Response;
  try {
    res = await fetch(adminApiUrl(path), {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new AdminApiError(503, { error: "The server is not reachable. Is the backend running?", code: "unreachable" });
  }

  if (res.status === 401) redirect(`/admin/auth/refresh?next=${encodeURIComponent(returnTo)}`);
  const json = (await res.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!res.ok) throw new AdminApiError(res.status, json);
  return json;
}

/** GET that returns null on 404, for detail pages that should show notFound(). */
export async function adminFind<T>(path: string, returnTo: string): Promise<T | null> {
  try {
    return await adminFetch<T>(path, { returnTo });
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) return null;
    throw err;
  }
}

/** Query string from list params, skipping blanks. */
export function listQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/* ---------- Cached per request ---------- */

/** The signed-in user. Shared by the sidebar, top bar and page in one request. */
export const getMe = cache((returnTo: string = "/admin") => adminFetch<Me>("auth/me/", { returnTo }));

export const getOptions = cache((returnTo: string = "/admin") => adminFetch<Options>("options/", { returnTo }));
