import { PhotoCreditForm } from "@/components/admin/forms/CatalogForms";
import { PageTitle } from "@/components/admin/kit";
import { submitRecord } from "@/lib/admin/actions";

export const metadata = { title: "New photo credit" };

export default function NewCredit() {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Catalog" title="New photo credit" />
      <PhotoCreditForm
        action={submitRecord.bind(null, { path: "photo-credits/", method: "POST", redirectTo: "/admin/photo-credits/{id}", message: "Credit added." })}
        initial={{ title: "", author: "", licence: "", source: "", usedFor: "" }}
        cancelHref="/admin/photo-credits"
      />
    </div>
  );
}
