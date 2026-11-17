import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ReviewForm } from "@/components/admin/forms/CatalogForms";
import { PageTitle } from "@/components/admin/kit";
import { deleteRecord, submitRecord } from "@/lib/admin/actions";
import { adminFind, type Review } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Edit review" };

export default async function EditReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const review = await adminFind<Review>(`reviews/${id}/`, `/admin/reviews/${id}`);
  if (!review) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow="Review"
        title={review.name}
        actions={
          <ConfirmButton
            action={deleteRecord.bind(null, { path: `reviews/${id}/`, redirectTo: "/admin/reviews", message: "Review deleted." })}
            label="Delete"
            title="Delete this review?"
            body={<p>It will no longer appear on the website. This cannot be undone.</p>}
            confirmLabel="Yes, delete it"
          />
        }
      />
      <ReviewForm action={submitRecord.bind(null, { path: `reviews/${id}/`, method: "PATCH", redirectTo: `/admin/reviews/${id}`, message: "Review saved." })} initial={review} cancelHref="/admin/reviews" />
    </div>
  );
}
