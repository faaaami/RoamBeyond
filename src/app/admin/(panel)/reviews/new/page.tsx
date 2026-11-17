import { ReviewForm } from "@/components/admin/forms/CatalogForms";
import { PageTitle } from "@/components/admin/kit";
import { submitRecord } from "@/lib/admin/actions";

export const metadata = { title: "New review" };

export default function NewReview() {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Catalog" title="New review" />
      <ReviewForm
        action={submitRecord.bind(null, { path: "reviews/", method: "POST", redirectTo: "/admin/reviews/{id}", message: "Review added." })}
        initial={{ text: "", name: "", trip: "", isPublished: true, sortOrder: 100 }}
        cancelHref="/admin/reviews"
      />
    </div>
  );
}
