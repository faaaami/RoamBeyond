import { DestinationForm } from "@/components/admin/forms/CatalogForms";
import { PageTitle } from "@/components/admin/kit";
import { submitRecord } from "@/lib/admin/actions";

export const metadata = { title: "New destination" };

const blank = { name: "", slug: "", region: "", tagline: "", description: "", bestSeason: "", knownFor: [], image: null, isPublished: true, popular: false, sortOrder: 100 };

export default function NewDestination() {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Catalog" title="New destination" />
      <DestinationForm
        action={submitRecord.bind(null, { path: "destinations/", method: "POST", redirectTo: "/admin/destinations/{id}", message: "Destination created." })}
        initial={blank}
        cancelHref="/admin/destinations"
      />
    </div>
  );
}
