import { notFound } from "next/navigation";
import { TripTypeForm } from "@/components/admin/forms/PageForms";
import { PageTitle } from "@/components/admin/kit";
import { submitRecord } from "@/lib/admin/actions";
import { adminFind, type TripTypeInfo } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Edit trip type" };

export default async function EditTripType({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const trip = await adminFind<TripTypeInfo>(`trip-types/${id}/`, `/admin/trip-types/${id}`);
  if (!trip) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Trip type" title={trip.label} />
      <TripTypeForm action={submitRecord.bind(null, { path: `trip-types/${id}/`, method: "PATCH", redirectTo: `/admin/trip-types/${id}`, message: "Trip type saved." })} initial={trip} cancelHref="/admin/trip-types" />
    </div>
  );
}
