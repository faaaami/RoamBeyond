import { Tags } from "lucide-react";
import { ResourceList } from "@/components/admin/ResourceList";
import { PageTitle } from "@/components/admin/kit";
import type { Column } from "@/components/admin/DataTable";
import type { TripTypeInfo } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Trip types" };

const columns: Column<TripTypeInfo>[] = [
  { key: "label", label: "Name", cell: (t) => t.label },
  { key: "blurb", label: "Sentence", cell: (t) => <span className="text-muted">{t.blurb || "—"}</span> },
];

export default async function TripTypesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Website pages" title="Trip types" description="The five trip types visitors choose from. Edit their wording here." />
      <ResourceList<TripTypeInfo>
        basePath="/admin/trip-types"
        endpoint="trip-types/"
        searchParams={searchParams}
        columns={columns}
        searchPlaceholder="Search trip types"
        emptyTitle="No trip types"
        emptyText="The five trip types are created with the site."
        caption="Trip types"
        icon={Tags}
      />
    </div>
  );
}
