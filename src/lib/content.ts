import { cacheLife, cacheTag } from "next/cache";
import { siteConfig } from "@/config/site";
import type {
  BudgetBand,
  Category,
  Destination,
  DurationBand,
  PackageSummary,
  PhotoCredit,
  Review,
  SiteSettings,
  TourPackage,
} from "@/data/types";
import type { AboutContent, HomeContent, LegalContent, PagesContent } from "@/lib/content-types";
import { serverApiUrl } from "@/lib/server-api";
import { fillAllTokens } from "@/lib/tokens";

export type { AboutContent, HomeContent, LegalContent, PagesContent, StoryScene } from "@/lib/content-types";

/**
 * Everything the website reads from the Django content API goes through
 * these functions. Responses are cached under one tag; the backend calls
 * /api/revalidate after an admin edit to clear it (backend/apps/core/revalidation.py).
 * Calling the same function from several components on one page costs one request.
 */

export const CONTENT_TAG = "content";

class ContentApiError extends Error {}

/** Used for structured data (schema.org); the agency operates in India. */
const COUNTRY = "IN";

/** GET a content endpoint. Returns null for 404 so callers can show notFound(). */
async function fetchContent<T>(path: string): Promise<T | null> {
  "use cache";
  cacheTag(CONTENT_TAG);
  // Safety net if a revalidation call is ever missed: refresh at least daily.
  cacheLife("days");

  const url = serverApiUrl(path);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new ContentApiError(`GET ${url} failed with ${res.status}`);
  return (await res.json()) as T;
}

async function fetchRequired<T>(path: string): Promise<T> {
  const data = await fetchContent<T>(path);
  if (data === null) throw new ContentApiError(`GET /api/v1/${path} returned 404`);
  return data;
}

/* ---------- Fixed choices ---------- */

export interface Vocabulary {
  categories: { id: Category; label: string }[];
  durations: { id: DurationBand; label: string; min: number; max: number }[];
  budgets: { id: BudgetBand; label: string }[];
}

/** Category, trip-length and budget labels. The choices are fixed in the backend. */
export function getVocabulary(): Promise<Vocabulary> {
  return fetchRequired<Vocabulary>("vocabulary/");
}

/* ---------- Site settings ---------- */

interface SettingsDoc {
  tagline: string;
  description: string;
  phone: { display: string; href: string };
  whatsapp: { display: string; number: string };
  email: string;
  address: { display: string; locality: string; region: string; mapQuery: string };
  hours: string;
  callbackWindow: string;
  social: { instagram: string; facebook: string; youtube: string };
  cancellationTerms: string[];
  budgetRanges: Record<string, string>;
}

/** Agency details from "Site settings", as the admin wrote them. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const [doc, vocabulary] = await Promise.all([
    fetchRequired<SettingsDoc>("site-settings/"),
    getVocabulary(),
  ]);
  return {
    tagline: doc.tagline,
    description: doc.description,
    phone: doc.phone,
    whatsapp: doc.whatsapp,
    email: doc.email,
    address: { ...doc.address, country: COUNTRY },
    hours: doc.hours,
    callbackWindow: doc.callbackWindow,
    social: doc.social,
    cancellationTerms: doc.cancellationTerms.filter((t) => t.trim() !== ""),
    budgets: vocabulary.budgets.map((b) => ({ ...b, range: doc.budgetRanges[b.id] ?? "" })),
  };
}

/* ---------- Navigation and trip types ---------- */

export interface NavLink {
  label: string;
  href: string;
}

export interface TripTypeInfo {
  id: "solo" | "couple" | "family" | "friends" | "corporate";
  label: string;
  blurb: string;
}

/** Header and footer links, managed in the admin under Navigation. */
export function getNavLinks(): Promise<NavLink[]> {
  return fetchRequired<NavLink[]>("navigation/");
}

/** The five trip types with their wording, managed under Trip types. */
export function getTripTypes(): Promise<TripTypeInfo[]> {
  return fetchRequired<TripTypeInfo[]>("trip-types/");
}

/* ---------- Catalog ---------- */

export function getDestinations(): Promise<Destination[]> {
  return fetchRequired<Destination[]>("destinations/");
}

export async function getDestination(slug: string): Promise<Destination | undefined> {
  return (await getDestinations()).find((d) => d.slug === slug);
}

/** All packages, with just the fields that cards and filters need. */
export function getPackages(): Promise<PackageSummary[]> {
  return fetchRequired<PackageSummary[]>("packages/");
}

type PackageDoc = Omit<TourPackage, "itinerary"> & {
  itinerary: { day: number; title: string; description: string; meals: string; stay: string }[];
};

/** One package with its full itinerary and gallery (cover first), or null if the slug is unknown. */
export async function getPackage(slug: string): Promise<TourPackage | null> {
  const doc = await fetchContent<PackageDoc>(`packages/${encodeURIComponent(slug)}/`);
  if (!doc) return null;
  return {
    ...doc,
    itinerary: doc.itinerary.map((day) => ({
      ...day,
      meals: day.meals || undefined,
      stay: day.stay || undefined,
    })),
  };
}

export function getReviews(): Promise<Review[]> {
  return fetchRequired<Review[]>("reviews/");
}

export function getPhotoCredits(): Promise<PhotoCredit[]> {
  return fetchRequired<PhotoCredit[]>("photo-credits/");
}

/* ---------- Page text and search titles ---------- */

/** Home page wording. {placeholders} are filled in from Site settings. */
export async function getHomePage(): Promise<HomeContent> {
  const [doc, site] = await Promise.all([
    fetchRequired<HomeContent>("pages/home/"),
    getSiteSettings(),
  ]);
  const scenes = (doc.scenes ?? []).filter((scene) => scene.image);
  return fillAllTokens({ ...doc, scenes }, site);
}

export async function getAboutPage(): Promise<AboutContent> {
  const [doc, site] = await Promise.all([fetchRequired<AboutContent>("pages/about/"), getSiteSettings()]);
  return fillAllTokens(doc, site);
}

/** Headings and short texts for the packages, destinations, plan, contact and thank-you pages. */
export async function getPagesText(): Promise<PagesContent> {
  const [doc, site] = await Promise.all([fetchRequired<PagesContent>("pages/other/"), getSiteSettings()]);
  return fillAllTokens(doc, site);
}

/**
 * The privacy policy or the terms. Placeholders are left in the text here:
 * the RichText component turns {email} and {phone} into links.
 */
export function getLegalPage(page: "privacy" | "terms"): Promise<LegalContent> {
  return fetchRequired<LegalContent>(`pages/${page}/`);
}

export interface PageSeo {
  title: string;
  description: string;
}

/**
 * The search title and description for a page, by its path, e.g. "/about".
 * Managed in the admin under Page titles.
 */
export async function getPageSeo(path: string): Promise<PageSeo> {
  const all = await fetchRequired<Record<string, PageSeo>>("seo/");
  return all[path] ?? { title: siteConfig.name, description: "" };
}
