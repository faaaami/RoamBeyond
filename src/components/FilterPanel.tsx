"use client";

import { X } from "lucide-react";
import type { PackageFilters } from "@/lib/filters";
import { useSite } from "./SiteProvider";
import { buttonClass } from "./ui/button";
import { inputClass } from "./ui/Field";

type FilterKey = "destination" | "type" | "duration" | "category" | "budget";

type FilterGroup = { key: FilterKey; label: string; any: string; options: { value: string; label: string }[] };

/** Destinations and budget ranges come from the backend; the other options are fixed. */
const buildGroups = ({ settings, destinations, tripTypes, vocabulary }: ReturnType<typeof useSite>): FilterGroup[] => [
  {
    key: "destination",
    label: "Destination",
    any: "All destinations",
    options: destinations.map((d) => ({ value: d.slug, label: d.name })),
  },
  {
    key: "type",
    label: "Trip type",
    any: "Any trip type",
    options: tripTypes.map((t) => ({ value: t.id, label: t.label })),
  },
  {
    key: "duration",
    label: "Duration",
    any: "Any length",
    options: vocabulary.durations.map((d) => ({ value: d.id, label: d.label })),
  },
  {
    key: "category",
    label: "Category",
    any: "All categories",
    options: vocabulary.categories.map((c) => ({ value: c.id, label: c.label })),
  },
  {
    key: "budget",
    label: "Budget per person",
    any: "Any budget",
    options: settings.budgets.map((b) => ({ value: b.id, label: `${b.label} (${b.range})` })),
  },
];

/**
 * Filter controls for the package listing. Stateless: the parent owns the
 * values (they live in the URL) and receives changes through `onChange`.
 */
export function FilterPanel({
  filters,
  activeCount,
  onChange,
  onClear,
}: {
  filters: PackageFilters;
  activeCount: number;
  onChange: (key: FilterKey, value: string) => void;
  onClear: () => void;
}) {
  const groups = buildGroups(useSite());

  return (
    <form
      aria-label="Filter packages"
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Filters</h2>
        {activeCount > 0 && (
          <button type="button" onClick={onClear} className={buttonClass("ghost", "md", "-mr-3 px-3")}>
            <X className="h-4 w-4" aria-hidden="true" />
            Clear all
          </button>
        )}
      </div>

      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-1.5">
          <label htmlFor={`filter-${group.key}`} className="text-sm font-semibold">
            {group.label}
          </label>
          <select
            id={`filter-${group.key}`}
            value={filters[group.key]}
            onChange={(e) => onChange(group.key, e.target.value)}
            className={inputClass}
          >
            <option value="">{group.any}</option>
            {group.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </form>
  );
}
