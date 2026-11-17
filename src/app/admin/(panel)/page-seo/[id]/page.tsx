import { notFound } from "next/navigation";
import { PageSeoForm } from "@/components/admin/forms/PageForms";
import { PageTitle } from "@/components/admin/kit";
import { submitRecord } from "@/lib/admin/actions";
import { adminFind, type PageSeo } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Edit page title" };

export default async function EditPageSeo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const seo = await adminFind<PageSeo>(`page-seo/${id}/`, `/admin/page-seo/${id}`);
  if (!seo) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Page title" title={seo.path} description="Shown in search results and link previews." />
      <PageSeoForm action={submitRecord.bind(null, { path: `page-seo/${id}/`, method: "PATCH", redirectTo: `/admin/page-seo/${id}`, message: "Page title saved." })} initial={seo} cancelHref="/admin/page-seo" />
    </div>
  );
}
