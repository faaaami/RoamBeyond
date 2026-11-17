import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const base = "inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold";

/** "Showing 21-40 of 57" with previous/next links. Hidden when everything fits on one page. */
export function Pagination({
  count,
  page,
  pageSize,
  hrefFor,
}: {
  count: number;
  page: number;
  pageSize: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  const link = (target: number, label: string, dir: "prev" | "next") => {
    const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
    const disabled = target < 1 || target > pages;
    const content = (
      <>
        {dir === "prev" && <Icon className="h-4 w-4" aria-hidden="true" />}
        {label}
        {dir === "next" && <Icon className="h-4 w-4" aria-hidden="true" />}
      </>
    );
    return disabled ? (
      <span aria-disabled="true" className={cn(base, "opacity-50")}>
        {content}
      </span>
    ) : (
      <Link href={hrefFor(target)} rel={dir} className={cn(base, "transition-colors hover:border-green hover:text-green")}>
        {content}
      </Link>
    );
  };

  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Showing <span className="font-semibold text-ink">{from}–{to}</span> of {count} · page {page} of {pages}
      </p>
      <div className="flex gap-2">
        {link(page - 1, "Previous", "prev")}
        {link(page + 1, "Next", "next")}
      </div>
    </nav>
  );
}
