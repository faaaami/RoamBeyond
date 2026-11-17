import { OtherPagesForm } from "@/components/admin/forms/PageForms";
import { PageTitle } from "@/components/admin/kit";
import { submitRecord } from "@/lib/admin/actions";
import { adminFetch } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Other pages" };

export default async function OtherPages() {
  const other = await adminFetch<Record<string, unknown>>("pages/other/", { returnTo: "/admin/other-pages" });
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Website pages" title="Other pages" description="Headings and short texts on the Packages, Destinations, Plan my trip, Contact and Thank you pages." />
      <OtherPagesForm
        action={submitRecord.bind(null, { path: "pages/other/", method: "PATCH", redirectTo: "/admin/other-pages", message: "Page text saved." })}
        initial={other}
      />
    </div>
  );
}
