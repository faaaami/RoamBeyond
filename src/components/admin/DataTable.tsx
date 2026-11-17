import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  cell: (row: T) => ReactNode;
  /** Backend ordering field; makes the header a sort toggle. */
  sort?: string;
  className?: string;
  /** Leave out of the stacked mobile card (e.g. data already in the title). */
  hideOnMobile?: boolean;
}

/**
 * A list of records: a table on wider screens, stacked cards on phones.
 * Sorting is link based (?ordering=field / -field), so it works without
 * JavaScript and every view can be bookmarked.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  ordering,
  sortHref,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  /** Current ?ordering value, e.g. "-created_at". */
  ordering?: string;
  sortHref: (ordering: string) => string;
  caption: string;
}) {
  const [primary, ...rest] = columns;

  return (
    <>
      {/* Desktop and tablet */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[0.9375rem]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line">
              {columns.map((col) => (
                <th key={col.key} scope="col" className={cn("px-4 py-3 text-xs font-semibold whitespace-nowrap uppercase tracking-wide text-muted first:pl-5 md:first:pl-6", col.className)}>
                  {col.sort ? <SortLink col={col} ordering={ordering} sortHref={sortHref} /> : col.label}
                </th>
              ))}
              {rowHref && <th scope="col" className="w-10"><span className="sr-only">Open</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={rowKey(row)} className={cn("group align-middle", rowHref && "relative transition-colors hover:bg-paper")}>
                {columns.map((col, i) => (
                  <td key={col.key} className={cn("px-4 py-3.5 first:pl-5 md:first:pl-6", col.className)}>
                    {i === 0 && rowHref ? (
                      // The first cell's link stretches over the row, so the whole row is clickable
                      // while screen readers get one link per record.
                      <Link href={rowHref(row)} className="font-semibold text-ink after:absolute after:inset-0 hover:text-green">
                        {col.cell(row)}
                      </Link>
                    ) : (
                      col.cell(row)
                    )}
                  </td>
                ))}
                {rowHref && (
                  <td className="pr-5">
                    <ChevronRight className="h-5 w-5 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: each record is a card. The title link stretches over the card, so
          nested links (e.g. a source link) stay valid HTML. */}
      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="relative px-5 py-4 active:bg-paper">
            <div className="font-semibold text-ink">
              {rowHref ? (
                <Link href={rowHref(row)} className="after:absolute after:inset-0">
                  {primary.cell(row)}
                </Link>
              ) : (
                primary.cell(row)
              )}
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {rest
                .filter((c) => !c.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className="min-w-0">
                    <dt className="text-xs text-muted">{col.label}</dt>
                    <dd className="mt-0.5 truncate">{col.cell(row)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

function SortLink<T>({ col, ordering, sortHref }: { col: Column<T>; ordering?: string; sortHref: (o: string) => string }) {
  const field = col.sort!;
  const active = ordering === field ? "asc" : ordering === `-${field}` ? "desc" : null;
  // First click sorts A-Z / oldest first; second click reverses.
  const next = active === "asc" ? `-${field}` : field;
  const Icon = active === "asc" ? ArrowUp : active === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <Link
      href={sortHref(next)}
      className={cn("inline-flex items-center gap-1 rounded hover:text-green", active && "text-green")}
      aria-label={`Sort by ${col.label}${active === "asc" ? ", currently ascending" : active === "desc" ? ", currently descending" : ""}`}
    >
      {col.label}
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  );
}
