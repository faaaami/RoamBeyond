"use client";

import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { PackageSummary } from "@/data/types";
import { PAGE_SIZE, applyFilters, filterKeys, parseFilters, sortOptions } from "@/lib/filters";
import { useSite } from "./SiteProvider";
import { cn } from "@/lib/utils";
import { FilterPanel } from "./FilterPanel";
import { PackageCard } from "./PackageCard";
import { buttonClass } from "./ui/button";
import { inputClass } from "./ui/Field";

/**
 * Package grid with filters, sort and pagination. All state lives in the URL
 * query string (?destination=goa&type=couple&sort=name&page=2), so results can
 * be shared, bookmarked and reached from the hero quick search.
 */
export function PackageListing({ packages }: { packages: PackageSummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = parseFilters(new URLSearchParams(searchParams.toString()));
  const { vocabulary } = useSite();
  const results = applyFilters(packages, filters, vocabulary.durations);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const visible = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = filterKeys.filter((k) => filters[k]).length;

  /** Builds a URL with some params changed. Empty values are removed to keep URLs clean. */
  const hrefWith = (changes: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const update = (changes: Record<string, string>) => {
    // Any filter or sort change goes back to page 1.
    router.replace(hrefWith({ ...changes, page: "" }), { scroll: false });
  };
  const clearAll = () => router.replace(pathname, { scroll: false });

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
      <div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls="filter-panel"
          className={buttonClass("outline", "md", "w-full lg:hidden")}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {filtersOpen ? "Hide filters" : "Show filters"}
          {activeCount > 0 && (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-cream px-1.5 text-xs font-bold text-ink">
              {activeCount}
            </span>
          )}
        </button>
        <div
          id="filter-panel"
          className={cn("mt-3 lg:sticky lg:top-24 lg:mt-0 lg:block", !filtersOpen && "hidden")}
        >
          <FilterPanel
            filters={filters}
            activeCount={activeCount}
            onChange={(key, value) => update({ [key]: value })}
            onClear={clearAll}
          />
        </div>
      </div>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="font-medium text-muted">
            {results.length === 0
              ? "No packages found"
              : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${(page - 1) * PAGE_SIZE + visible.length} of ${results.length} ${results.length === 1 ? "package" : "packages"}`}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="shrink-0 text-sm font-semibold">
              Sort by
            </label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value === "featured" ? "" : e.target.value })}
              className={cn(inputClass, "sm:w-56")}
            >
              {sortOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visible.length > 0 ? (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((pkg, i) => (
              <li key={pkg.slug}>
                <PackageCard pkg={pkg} priority={i < 3} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-line bg-white px-6 py-16 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-mist text-green">
              <SearchX className="h-8 w-8" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-2xl font-bold">No packages match these filters</h2>
            <p className="mt-2 max-w-md text-muted">
              Try removing a filter, or tell us what you have in mind and we will plan a trip
              around it.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={clearAll} className={buttonClass("outline", "md")}>
                Clear all filters
              </button>
              <Link href="/plan-my-trip" className={buttonClass("primary", "md")}>
                Plan a custom trip
              </Link>
            </div>
          </div>
        )}

        {pageCount > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
            <PageLink
              href={hrefWith({ page: page > 2 ? String(page - 1) : "" })}
              disabled={page === 1}
              label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </PageLink>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <PageLink
                key={n}
                href={hrefWith({ page: n === 1 ? "" : String(n) })}
                current={n === page}
                label={`Page ${n}`}
              >
                {n}
              </PageLink>
            ))}
            <PageLink
              href={hrefWith({ page: String(page + 1) })}
              disabled={page === pageCount}
              label="Next page"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </PageLink>
          </nav>
        )}
      </div>
    </div>
  );
}

function PageLink({
  href,
  label,
  current = false,
  disabled = false,
  children,
}: {
  href: string;
  label: string;
  current?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    "inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 font-semibold transition-[transform,background-color] active:scale-95",
    current ? "bg-green text-white" : "bg-white text-ink hover:bg-mist",
    disabled && "pointer-events-none opacity-40",
  );
  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={className}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} aria-current={current ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}
