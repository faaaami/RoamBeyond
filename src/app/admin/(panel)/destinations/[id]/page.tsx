import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { DestinationForm } from "@/components/admin/forms/CatalogForms";
import { PageTitle } from "@/components/admin/kit";
import { deleteRecord, submitRecord } from "@/lib/admin/actions";
import { adminFind, type Destination } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Edit destination" };

export default async function EditDestination({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const dest = await adminFind<Destination>(`destinations/${id}/`, `/admin/destinations/${id}`);
  if (!dest) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow="Destination"
        title={dest.name}
        description={`${dest.packageCount} published package${dest.packageCount === 1 ? "" : "s"}.`}
        actions={
          <ConfirmButton
            action={deleteRecord.bind(null, { path: `destinations/${id}/`, redirectTo: "/admin/destinations", message: "Destination deleted." })}
            label="Delete"
            title={`Delete ${dest.name}?`}
            body={<p>A destination can only be deleted once none of its packages remain. You will see a message if some do.</p>}
            confirmLabel="Yes, delete it"
          />
        }
      />
      <DestinationForm
        action={submitRecord.bind(null, { path: `destinations/${id}/`, method: "PATCH", redirectTo: `/admin/destinations/${id}`, message: "Destination saved." })}
        initial={dest}
        cancelHref="/admin/destinations"
      />
    </div>
  );
}
