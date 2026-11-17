import { Menu } from "lucide-react";
import { AddButton, ResourceList } from "@/components/admin/ResourceList";
import { PageTitle } from "@/components/admin/kit";
import type { Column } from "@/components/admin/DataTable";
import type { NavLink } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Navigation" };

const columns: Column<NavLink>[] = [
  { key: "label", label: "Link", cell: (l) => l.label },
  { key: "href", label: "Page", cell: (l) => <span className="text-muted">{l.href}</span> },
  { key: "position", label: "Order", cell: (l) => l.position },
  { key: "shown", label: "Shown", cell: (l) => (l.isPublished ? "Yes" : "Hidden") },
];

export default async function NavLinksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Website pages" title="Navigation" description="The links in the header and the footer's Explore column." actions={<AddButton href="/admin/nav-links/new" label="Add link" />} />
      <ResourceList<NavLink>
        basePath="/admin/nav-links"
        endpoint="nav-links/"
        searchParams={searchParams}
        columns={columns}
        searchPlaceholder="Search links"
        emptyTitle="No links yet"
        emptyText="Add the pages visitors should find from the header."
        caption="Navigation links"
        icon={Menu}
      />
    </div>
  );
}
