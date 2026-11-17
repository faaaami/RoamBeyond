import type { PackageSummary } from "@/data/types";

/** Same destination or category first, then anything else, excluding the package itself. */
export function getRelatedPackages<T extends PackageSummary>(pkg: PackageSummary, all: T[], count = 3): T[] {
  const others = all.filter((p) => p.slug !== pkg.slug);
  const score = (p: PackageSummary) =>
    (p.destination === pkg.destination ? 4 : 0) +
    (p.category === pkg.category ? 2 : 0) +
    (p.tripTypes.some((t) => pkg.tripTypes.includes(t)) ? 1 : 0);
  return [...others].sort((a, b) => score(b) - score(a)).slice(0, count);
}

export function formatPrice(priceFrom: number | null): string {
  return priceFrom === null ? "₹[PRICE]" : `₹${priceFrom.toLocaleString("en-IN")}`;
}

export function formatDuration(pkg: Pick<PackageSummary, "days" | "nights">): string {
  return `${pkg.days}D/${pkg.nights}N`;
}
