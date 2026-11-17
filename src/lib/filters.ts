import type { PackageSummary } from "@/data/types";
import type { Vocabulary } from "@/lib/content";

export const PAGE_SIZE = 6;

export const sortOptions = [
  { id: "featured", label: "Featured first" },
  { id: "duration-asc", label: "Shortest first" },
  { id: "duration-desc", label: "Longest first" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "name", label: "Name: A to Z" },
] as const;
export type SortId = (typeof sortOptions)[number]["id"];

export interface PackageFilters {
  destination: string;
  type: string;
  duration: string;
  category: string;
  budget: string;
  sort: SortId;
  page: number;
}

export const filterKeys = ["destination", "type", "duration", "category", "budget"] as const;

/** Reads filters from the URL query string, ignoring anything unexpected. */
export function parseFilters(params: URLSearchParams): PackageFilters {
  const sort = params.get("sort");
  const page = Number(params.get("page"));
  return {
    destination: params.get("destination") ?? "",
    type: params.get("type") ?? "",
    duration: params.get("duration") ?? "",
    category: params.get("category") ?? "",
    budget: params.get("budget") ?? "",
    sort: sortOptions.some((s) => s.id === sort) ? (sort as SortId) : "featured",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function applyFilters(
  all: PackageSummary[],
  f: PackageFilters,
  durations: Vocabulary["durations"],
): PackageSummary[] {
  const band = durations.find((d) => d.id === f.duration);

  const filtered = all.filter(
    (p) =>
      (!f.destination || p.destination === f.destination) &&
      (!f.type || p.tripTypes.some((t) => t === f.type)) &&
      (!band || (p.days >= band.min && p.days <= band.max)) &&
      (!f.category || p.category === f.category) &&
      (!f.budget || p.budget === f.budget),
  );

  const sorted = [...filtered];
  switch (f.sort) {
    case "duration-asc":
      sorted.sort((a, b) => a.days - b.days);
      break;
    case "duration-desc":
      sorted.sort((a, b) => b.days - a.days);
      break;
    case "price-asc":
      // Packages without a price yet go last.
      sorted.sort((a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity));
      break;
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
  return sorted;
}
