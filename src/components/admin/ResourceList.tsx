import { Plus, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { adminFetch, AdminApiError, listQuery, type Page } from "@/lib/admin/api";
import { flattenSearchParams, withQuery, type Query } from "@/lib/admin/url";
import { Card, EmptyState } from "./kit";
import { DataTable, type Column } from "./DataTable";
import { ListToolbar, type FilterOption } from "./ListToolbar";
import { Pagination } from "./Pagination";

/**
 * A searchable, filterable, sortable, paginated list of one kind of record.
 * Server component: it fetches the page of results and renders the table.
 * Filters, search and sorting all live in the URL.
 */
export async function ResourceList<T extends { id: number | string }>({
  basePath,
  endpoint,
  searchParams,
  columns,
  filters = [],
  searchPlaceholder,
  emptyTitle,
  emptyText,
  caption,
  icon,
  footer,
}: {
  basePath: string;
  endpoint: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  columns: Column<T>[];
  filters?: FilterOption[];
  searchPlaceholder: string;
  emptyTitle: string;
  emptyText: string;
  caption: string;
  icon: Parameters<typeof EmptyState>[0]["icon"];
  footer?: ReactNode;
}) {
  const current: Query = flattenSearchParams(await searchParams);
  const page = Math.max(1, Number.parseInt(current.page ?? "", 10) || 1);
  const here = withQuery(basePath, current, {});

  const params: Record<string, string | undefined> = {
    q: current.q?.slice(0, 100),
    ordering: current.ordering,
    page: String(page),
  };
  for (const f of filters) params[f.param] = current[f.param];

  let data: Page<T>;
  try {
    data = await adminFetch<Page<T>>(`${endpoint}${listQuery(params)}`, { returnTo: here });
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 403) {
      return (
        <Card>
          <EmptyState icon={ShieldAlert} title="You do not have access here" text="Ask an administrator if you need to see this section." />
        </Card>
      );
    }
    throw err;
  }

  return (
    <div className="flex flex-col gap-5">
      <Suspense>
        <ListToolbar placeholder={searchPlaceholder} filters={filters} />
      </Suspense>

      <Card flush>
        {data.results.length > 0 ? (
          <DataTable
            caption={caption}
            columns={columns}
            rows={data.results}
            rowKey={(row) => String(row.id)}
            rowHref={(row) => `${basePath}/${row.id}`}
            ordering={current.ordering}
            sortHref={(ordering) => withQuery(basePath, current, { ordering })}
          />
        ) : current.q || filters.some((f) => current[f.param]) ? (
          <EmptyState icon={icon} title="No matches" text="Nothing matches these search terms or filters." action={<Link href={basePath} className="font-semibold text-green hover:underline">Clear search and filters</Link>} />
        ) : (
          <EmptyState icon={icon} title={emptyTitle} text={emptyText} />
        )}
      </Card>

      <Pagination count={data.count} page={page} pageSize={20} hrefFor={(p) => withQuery(basePath, current, { page: p })} />
      {footer}
    </div>
  );
}

/** The "Add …" button shown in a list's title row. */
export function AddButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-green px-5 font-semibold text-white transition-colors hover:bg-ink">
      <Plus className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

/** Small "Published" / "Hidden" label for list cells. */
export function Flag({ on, yes = "Published", no = "Hidden" }: { on: boolean; yes?: string; no?: string }) {
  return (
    <span className={on ? "rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold text-green" : "rounded-full bg-line/60 px-2.5 py-0.5 text-xs font-semibold text-muted"}>
      {on ? yes : no}
    </span>
  );
}
