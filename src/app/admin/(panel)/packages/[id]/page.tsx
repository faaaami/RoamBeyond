import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { PackageForm } from "@/components/admin/forms/CatalogForms";
import { PageTitle } from "@/components/admin/kit";
import { deleteRecord, quickAction, submitRecord } from "@/lib/admin/actions";
import { adminFind, getOptions, type TourPackage } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Edit package" };

export default async function EditPackage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const returnTo = `/admin/packages/${id}`;
  const [pkg, options] = await Promise.all([adminFind<TourPackage>(`packages/${id}/`, returnTo), getOptions(returnTo)]);
  if (!pkg) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow={pkg.destinationName}
        title={pkg.name}
        description={pkg.isPublished ? "Published on the website." : "Hidden from the website until you publish it."}
        actions={
          <>
            <ConfirmButton
              action={quickAction.bind(null, { path: `packages/${id}/duplicate/`, method: "POST", json: {}, redirectTo: "/admin/packages/{id}", message: "A hidden copy was made. Review it, then publish.", returnTo })}
              label="Duplicate"
              title="Make a copy?"
              body={<p>A hidden copy is created with the same itinerary and photos. It is not published, so it does not go live by accident.</p>}
              confirmLabel="Make a copy"
              icon="copy"
              danger={false}
              variant="outline"
            />
            <ConfirmButton
              action={deleteRecord.bind(null, { path: `packages/${id}/`, redirectTo: "/admin/packages", message: "Package deleted." })}
              label="Delete"
              title={`Delete “${pkg.name}”?`}
              body={<p>The package, its itinerary and gallery are removed from the website and the admin. This cannot be undone.</p>}
              confirmLabel="Yes, delete it"
            />
          </>
        }
      />
      <PackageForm
        action={submitRecord.bind(null, { path: `packages/${id}/`, method: "PATCH", redirectTo: `/admin/packages/${id}`, message: "Package saved." })}
        initial={pkg}
        options={options}
        cancelHref="/admin/packages"
      />
    </div>
  );
}
