import { PackageForm } from "@/components/admin/forms/CatalogForms";
import { PageTitle } from "@/components/admin/kit";
import { submitRecord } from "@/lib/admin/actions";
import { getOptions } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "New package" };

const blank = {
  name: "", slug: "", destination: null, days: 1, nights: 0, priceFrom: null, tripTypes: [], category: "hills", budget: "comfort",
  featured: false, isPublished: false, sortOrder: 100, summary: "", overview: "", highlights: [], inclusions: [], exclusions: [],
  startCity: "", endCity: "", bestSeason: "", groupSize: "", stay: "", transport: "", cover: null, coverAlt: "", itinerary: [], photos: [],
};

export default async function NewPackage() {
  const options = await getOptions("/admin/packages/new");
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Catalog" title="New tour package" description="It is saved hidden. Turn on “Published” when it is ready." />
      <PackageForm
        action={submitRecord.bind(null, { path: "packages/", method: "POST", redirectTo: "/admin/packages/{id}", message: "Package created." })}
        initial={blank}
        options={options}
        cancelHref="/admin/packages"
      />
    </div>
  );
}
