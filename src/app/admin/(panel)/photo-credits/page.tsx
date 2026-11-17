import { Camera } from "lucide-react";
import { AddButton, ResourceList } from "@/components/admin/ResourceList";
import { PageTitle } from "@/components/admin/kit";
import type { Column } from "@/components/admin/DataTable";
import type { PhotoCredit } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Photo credits" };

const columns: Column<PhotoCredit>[] = [
  { key: "title", label: "Photo", sort: "title", cell: (c) => c.title },
  { key: "author", label: "Photographer", cell: (c) => <span className="text-muted">{c.author || "—"}</span> },
  { key: "licence", label: "Licence", sort: "licence", cell: (c) => c.licence },
  { key: "source", label: "Source", cell: (c) => <a href={c.source} target="_blank" rel="noopener noreferrer" className="text-green underline-offset-2 hover:underline">Open ↗</a> },
];

export default async function PhotoCreditsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Catalog" title="Photo credits" description="Listed on the /credits page. Licences that require credit must stay." actions={<AddButton href="/admin/photo-credits/new" label="Add credit" />} />
      <ResourceList<PhotoCredit>
        basePath="/admin/photo-credits"
        endpoint="photo-credits/"
        searchParams={searchParams}
        columns={columns}
        searchPlaceholder="Search title, photographer or note"
        emptyTitle="No photo credits yet"
        emptyText="Add a credit for every photo that needs one."
        caption="Photo credits"
        icon={Camera}
      />
    </div>
  );
}
