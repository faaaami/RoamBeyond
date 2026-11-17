import { ChevronRight, ScrollText } from "lucide-react";
import Link from "next/link";
import { Card, PageTitle } from "@/components/admin/kit";
import { Flag } from "@/components/admin/ResourceList";
import { adminFetch, type LegalPage } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Privacy and terms" };

export default async function LegalPages() {
  const pages = await adminFetch<LegalPage[]>("legal-pages/", { returnTo: "/admin/legal-pages" });
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Website pages" title="Privacy and terms" description="The full text of the privacy policy and the terms. Both pages always exist; you edit them, you do not add or delete them." />
      <Card flush>
        <ul className="divide-y divide-line">
          {pages.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/legal-pages/${p.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper md:px-6">
                <ScrollText className="h-5 w-5 shrink-0 text-green" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{p.title}</span>
                  <span className="block text-sm text-muted">{p.sections.length} section{p.sections.length === 1 ? "" : "s"} · Last updated: {p.lastUpdated || "not set"}</span>
                </span>
                <Flag on={p.hideTemplateNotice} yes="Reviewed" no="Template text" />
                <ChevronRight className="h-5 w-5 text-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
