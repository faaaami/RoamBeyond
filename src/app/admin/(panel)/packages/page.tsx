import { Luggage } from "lucide-react";
import { AddButton, Flag, ResourceList } from "@/components/admin/ResourceList";
import { PageTitle } from "@/components/admin/kit";
import { getOptions, type PackageSummary } from "@/lib/admin/api";
import { formatPrice } from "@/components/admin/format";
import type { Column } from "@/components/admin/DataTable";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Tour packages" };

const columns: Column<PackageSummary>[] = [
  { key: "name", label: "Package", sort: "name", cell: (p) => p.name },
  { key: "destination", label: "Destination", cell: (p) => <span className="text-muted">{p.destinationName}</span> },
  { key: "duration", label: "Length", sort: "days", cell: (p) => <span className="whitespace-nowrap">{p.days}D/{p.nights}N</span> },
  { key: "price", label: "From", sort: "price_from", cell: (p) => <span className="whitespace-nowrap tabular-nums">{p.priceFrom === null ? "Not set" : formatPrice(p.priceFrom)}</span> },
  { key: "category", label: "Category", cell: (p) => <span className="text-muted">{p.categoryLabel}</span> },
  { key: "featured", label: "Featured", cell: (p) => (p.featured ? <Flag on yes="Featured" no="—" /> : <span className="text-muted">—</span>) },
  { key: "status", label: "Status", cell: (p) => <Flag on={p.isPublished} /> },
];

export default async function PackagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const options = await getOptions("/admin/packages");
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Catalog" title="Tour packages" description="Each package's itinerary, photos and starting price. Hidden packages stay in the list." actions={<AddButton href="/admin/packages/new" label="Add package" />} />
      <ResourceList<PackageSummary>
        basePath="/admin/packages"
        endpoint="packages/"
        searchParams={searchParams}
        columns={columns}
        filters={[
          { param: "destination", label: "Destination", any: "All destinations", options: options.destinations },
          { param: "category", label: "Category", any: "All categories", options: options.categories },
          { param: "budget", label: "Budget", any: "Any budget", options: options.budgets },
          { param: "published", label: "Status", any: "Published and hidden", options: [{ value: "true", label: "Published" }, { value: "false", label: "Hidden" }] },
        ]}
        searchPlaceholder="Search name, summary or destination"
        emptyTitle="No tour packages yet"
        emptyText="Add your first package. It stays hidden until you publish it."
        caption="Tour packages"
        icon={Luggage}
      />
    </div>
  );
}
