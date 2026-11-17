"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { inputClass } from "@/components/ui/Field";

export interface FilterOption {
  param: string;
  label: string;
  /** Text of the "no filter" choice, e.g. "All statuses". */
  any: string;
  options: { value: string; label: string }[];
}

/**
 * Search box and filter dropdowns for an admin list. Everything lives in
 * the URL (?q=&status=...), so the server renders the results and any view
 * can be shared. Uses useSearchParams: render inside <Suspense>.
 */
export function ListToolbar({ placeholder, filters = [] }: { placeholder: string; filters?: FilterOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const firstRender = useRef(true);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page"); // new search or filter: back to page 1
    const query = next.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };

  // Search as you type, 300 ms after the last keystroke.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => update({ q: q.trim() }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the text changes
  }, [q]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative w-full md:max-w-sm">
        <label htmlFor="list-search" className="sr-only">
          Search
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id="list-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className={cn(inputClass, "pr-11 pl-11")}
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-mist hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </form>

      {filters.map((f) => (
        <div key={f.param} className="w-full md:w-auto md:min-w-44">
          <label htmlFor={`filter-${f.param}`} className="sr-only">
            {f.label}
          </label>
          <select
            id={`filter-${f.param}`}
            value={params.get(f.param) ?? ""}
            onChange={(e) => update({ [f.param]: e.target.value })}
            className={inputClass}
          >
            <option value="">{f.any}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Takes no space until there is something to say. */}
      <span aria-live="polite" className="text-sm text-muted empty:hidden md:ml-1">
        {pending && (
          <span className="inline-flex min-h-11 items-center">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Updating…
          </span>
        )}
      </span>
    </div>
  );
}
