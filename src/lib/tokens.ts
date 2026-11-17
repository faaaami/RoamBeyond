import type { SiteSettings } from "@/data/types";

/**
 * Replaces placeholders in admin-written text with values from Site settings,
 * e.g. "We call you back {callback-time}." Unknown placeholders are left alone.
 */
export function fillTokens(text: string, site: SiteSettings): string {
  return text
    .replaceAll("{callback-time}", site.callbackWindow)
    .replaceAll("{phone}", site.phone.display)
    .replaceAll("{email}", site.email)
    .replaceAll("{hours}", site.hours);
}

/** Runs fillTokens over every string inside an object or array. */
export function fillAllTokens<T>(value: T, site: SiteSettings): T {
  if (typeof value === "string") return fillTokens(value, site) as T;
  if (Array.isArray(value)) return value.map((v) => fillAllTokens(v, site)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, fillAllTokens(v, site)]),
    ) as T;
  }
  return value;
}
