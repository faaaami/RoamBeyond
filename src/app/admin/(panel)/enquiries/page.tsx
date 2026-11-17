import { AlarmClock, Inbox, SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { formatDate, formatMobile, timeAgo, todayInIndia } from "@/components/admin/format";
import { ListToolbar } from "@/components/admin/ListToolbar";
import { Pagination } from "@/components/admin/Pagination";
import { StatusPill } from "@/components/admin/StatusPill";
import { Card, EmptyState, PageTitle } from "@/components/admin/kit";
import { adminFetch, listQuery, type EnquirySummary, type Page } from "@/lib/admin/api";
import { flattenSearchParams, withQuery, type Query } from "@/lib/admin/url";
import { cn } from "@/lib/utils";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Enquiries" };

const PATH = "/admin/enquiries";
const PAGE_SIZE = 20;
const DEFAULTS = { view: "open" };

const VIEWS = [
  { id: "open", label: "Open" },
  { id: "new", label: "New" },
  { id: "due", label: "Follow-ups due" },
  { id: "mine", label: "Mine" },
  { id: "unassigned", label: "Unassigned" },
  { id: "closed", label: "Converted & closed" },
  { id: "all", label: "All" },
] as const;

const columns: Column<EnquirySummary>[] = [
  {
    key: "name",
    label: "Traveller",
    sort: "name",
    cell: (e) => (
      <span className="block whitespace-nowrap">
        {e.name}
        <span className="block text-sm font-normal tabular-nums text-muted">{formatMobile(e.mobile)}</span>
      </span>
    ),
  },
  {
    key: "kind",
    label: "Type",
    sort: "kind",
    cell: (e) => <span className="whitespace-nowrap text-muted">{e.kindLabel}</span>,
  },
  {
    key: "summary",
    label: "Request",
    className: "max-w-56",
    cell: (e) => <span className="line-clamp-1 text-muted">{e.summary || "—"}</span>,
  },
  { key: "status", label: "Status", sort: "status", cell: (e) => <StatusPill status={e.status} label={e.statusLabel} /> },
  {
    key: "assigned",
    label: "Assigned to",
    cell: (e) => (
      <span className="whitespace-nowrap">{e.assignedTo ? e.assignedTo.name : <span className="text-muted">Nobody</span>}</span>
    ),
  },
  {
    key: "followUp",
    label: "Follow up",
    sort: "follow_up_on",
    cell: (e) => {
      if (!e.followUpOn) return <span className="text-muted">—</span>;
      const overdue = (e.status === "new" || e.status === "contacted") && e.followUpOn <= todayInIndia();
      return (
        <span className={cn("inline-flex items-center gap-1 whitespace-nowrap", overdue && "font-semibold text-danger")}>
          {overdue && <AlarmClock className="h-3.5 w-3.5" aria-hidden="true" />}
          {formatDate(e.followUpOn)}
        </span>
      );
    },
  },
  {
    key: "received",
    label: "Received",
    sort: "created_at",
    cell: (e) => <span className="whitespace-nowrap text-muted">{timeAgo(e.createdAt)}</span>,
  },
];

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function EnquiriesPage({ searchParams }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow="Leads"
        title="Enquiries"
        description="Every form sent from the website. Open one to call the traveller and record the follow-up."
      />
      <Suspense fallback={<ListSkeleton />}>
        <EnquiryList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function EnquiryList({ searchParams }: Props) {
  const current: Query = flattenSearchParams(await searchParams);
  const view = VIEWS.some((v) => v.id === current.view) ? current.view! : "open";
  const page = Math.max(1, Number.parseInt(current.page ?? "", 10) || 1);
  const href = (changes: Record<string, string | number | null>) => withQuery(PATH, current, changes, DEFAULTS);

  const data = await adminFetch<Page<EnquirySummary>>(
    `enquiries/${listQuery({ view, q: current.q?.slice(0, 100), ordering: current.ordering, page })}`,
    { returnTo: href({ page }) },
  );

  return (
    <>
      <nav aria-label="Enquiry views" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {VIEWS.map((v) => (
          <Link
            key={v.id}
            href={href({ view: v.id })}
            aria-current={v.id === view ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
              v.id === view ? "border-green bg-green text-white" : "border-line bg-white text-ink hover:border-green",
            )}
          >
            {v.label}
          </Link>
        ))}
      </nav>

      <Suspense>
        <ListToolbar placeholder="Search name, phone, email or package" />
      </Suspense>

      <Card flush>
        {data.results.length > 0 ? (
          <DataTable
            caption="Enquiries"
            columns={columns}
            rows={data.results}
            rowKey={(e) => e.reference}
            rowHref={(e) => `${PATH}/${e.reference}`}
            ordering={current.ordering}
            sortHref={(ordering) => href({ ordering })}
          />
        ) : current.q ? (
          <EmptyState
            icon={SearchX}
            title="No matches"
            text={`No enquiries in this view match “${current.q}”.`}
            action={
              <Link href={href({ q: null })} className="font-semibold text-green hover:underline">
                Clear the search
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={Inbox}
            title="No enquiries here yet"
            text="When a traveller sends a form on the website, it appears in this list straight away."
          />
        )}
      </Card>

      <Pagination count={data.count} page={page} pageSize={PAGE_SIZE} hrefFor={(p) => href({ page: p })} />
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="flex animate-shimmer flex-col gap-4" aria-busy="true" aria-label="Loading enquiries">
      <div className="h-11 w-full rounded-full bg-mist" />
      <div className="h-11 w-full max-w-sm rounded-lg bg-mist" />
      <div className="h-[28rem] rounded-xl bg-mist" />
    </div>
  );
}
