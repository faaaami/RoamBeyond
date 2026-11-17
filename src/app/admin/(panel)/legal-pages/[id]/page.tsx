import { notFound } from "next/navigation";
import { LegalPageForm } from "@/components/admin/forms/PageForms";
import { PageTitle } from "@/components/admin/kit";
import { submitRecord } from "@/lib/admin/actions";
import { adminFind, type LegalPage } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Edit legal page" };

export default async function EditLegal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const page = await adminFind<LegalPage>(`legal-pages/${id}/`, `/admin/legal-pages/${id}`);
  if (!page) notFound();
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Privacy and terms" title={page.title} description={page.hideTemplateNotice ? "Marked as reviewed." : "Still marked as template text on the website."} />
      <LegalPageForm action={submitRecord.bind(null, { path: `legal-pages/${id}/`, method: "PATCH", redirectTo: `/admin/legal-pages/${id}`, message: "Page saved." })} initial={page} />
    </div>
  );
}
