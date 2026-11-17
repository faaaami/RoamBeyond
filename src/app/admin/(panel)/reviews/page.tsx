import { MessageSquareQuote } from "lucide-react";
import { AddButton, Flag, ResourceList } from "@/components/admin/ResourceList";
import { PageTitle } from "@/components/admin/kit";
import type { Column } from "@/components/admin/DataTable";
import type { Review } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Reviews" };

const columns: Column<Review>[] = [
  { key: "name", label: "Customer", sort: "name", cell: (r) => r.name },
  { key: "trip", label: "Trip", cell: (r) => <span className="text-muted">{r.trip || "—"}</span> },
  { key: "text", label: "Review", className: "max-w-md", cell: (r) => <span className="line-clamp-2 text-muted">{r.text}</span> },
  { key: "status", label: "Status", cell: (r) => <Flag on={r.isPublished} /> },
];

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Catalog" title="Customer reviews" description="Shown on the home page. Only publish real reviews, with the customer's permission." actions={<AddButton href="/admin/reviews/new" label="Add review" />} />
      <ResourceList<Review>
        basePath="/admin/reviews"
        endpoint="reviews/"
        searchParams={searchParams}
        columns={columns}
        filters={[{ param: "published", label: "Status", any: "Published and hidden", options: [{ value: "true", label: "Published" }, { value: "false", label: "Hidden" }] }]}
        searchPlaceholder="Search customer, trip or review"
        emptyTitle="No reviews yet"
        emptyText="Add reviews from real travellers. The home page hides this section while there are none."
        caption="Customer reviews"
        icon={MessageSquareQuote}
      />
    </div>
  );
}
