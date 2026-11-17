import { MapPin } from "lucide-react";
import { AddButton, Flag, ResourceList } from "@/components/admin/ResourceList";
import { PageTitle } from "@/components/admin/kit";
import type { Column } from "@/components/admin/DataTable";
import type { Destination } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Destinations" };

const columns: Column<Destination>[] = [
  { key: "name", label: "Destination", sort: "name", cell: (d) => d.name },
  { key: "region", label: "Region", sort: "region", cell: (d) => <span className="text-muted">{d.region}</span> },
  { key: "packages", label: "Packages", sort: "package_count", cell: (d) => <span className="tabular-nums">{d.packageCount}</span> },
  { key: "popular", label: "Popular", cell: (d) => (d.popular ? <Flag on yes="Popular" no="—" /> : <span className="text-muted">—</span>) },
  { key: "status", label: "Status", cell: (d) => <Flag on={d.isPublished} /> },
];

export default async function DestinationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Catalog" title="Destinations" description="The places you sell trips to. Each one has a photo and a short description." actions={<AddButton href="/admin/destinations/new" label="Add destination" />} />
      <ResourceList<Destination>
        basePath="/admin/destinations"
        endpoint="destinations/"
        searchParams={searchParams}
        columns={columns}
        filters={[{ param: "published", label: "Status", any: "Published and hidden", options: [{ value: "true", label: "Published" }, { value: "false", label: "Hidden" }] }]}
        searchPlaceholder="Search name, region or tagline"
        emptyTitle="No destinations yet"
        emptyText="Add the first place. Packages need a destination."
        caption="Destinations"
        icon={MapPin}
      />
    </div>
  );
}
