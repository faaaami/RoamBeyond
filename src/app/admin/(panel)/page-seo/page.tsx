import { Search } from "lucide-react";
import { ResourceList } from "@/components/admin/ResourceList";
import { PageTitle } from "@/components/admin/kit";
import type { Column } from "@/components/admin/DataTable";
import type { PageSeo } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Page titles" };

const columns: Column<PageSeo>[] = [
  { key: "path", label: "Page", cell: (p) => <span className="font-mono text-sm">{p.path}</span> },
  { key: "title", label: "Title", cell: (p) => p.title },
  { key: "description", label: "Description", cell: (p) => <span className="text-muted">{p.description ? `${p.description.slice(0, 80)}${p.description.length > 80 ? "…" : ""}` : "—"}</span> },
];

export default async function PageSeoPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Website pages" title="Page titles" description="The title and description search engines show for each page of the website." />
      <ResourceList<PageSeo>
        basePath="/admin/page-seo"
        endpoint="page-seo/"
        searchParams={searchParams}
        columns={columns}
        searchPlaceholder="Search pages or titles"
        emptyTitle="No pages"
        emptyText="The website's pages are created with the site."
        caption="Page titles"
        icon={Search}
      />
    </div>
  );
}
