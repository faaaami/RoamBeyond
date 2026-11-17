import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { PhotoCreditForm } from "@/components/admin/forms/CatalogForms";
import { PageTitle } from "@/components/admin/kit";
import { deleteRecord, submitRecord } from "@/lib/admin/actions";
import { adminFind, type PhotoCredit } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Edit photo credit" };

export default async function EditCredit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const credit = await adminFind<PhotoCredit>(`photo-credits/${id}/`, `/admin/photo-credits/${id}`);
  if (!credit) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow="Photo credit"
        title={credit.title}
        actions={
          <ConfirmButton
            action={deleteRecord.bind(null, { path: `photo-credits/${id}/`, redirectTo: "/admin/photo-credits", message: "Credit deleted." })}
            label="Delete"
            title="Delete this credit?"
            body={<p>Delete it when you have replaced the photo with your own. Removing a credit for a photo still on the site breaks the licence.</p>}
            confirmLabel="Yes, delete it"
          />
        }
      />
      <PhotoCreditForm action={submitRecord.bind(null, { path: `photo-credits/${id}/`, method: "PATCH", redirectTo: `/admin/photo-credits/${id}`, message: "Credit saved." })} initial={credit} cancelHref="/admin/photo-credits" />
    </div>
  );
}
