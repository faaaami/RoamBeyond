import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { NavLinkForm } from "@/components/admin/forms/PageForms";
import { PageTitle } from "@/components/admin/kit";
import { deleteRecord, submitRecord } from "@/lib/admin/actions";
import { adminFind, type NavLink } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Edit link" };

export default async function EditNavLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const link = await adminFind<NavLink>(`nav-links/${id}/`, `/admin/nav-links/${id}`);
  if (!link) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow="Navigation"
        title={link.label}
        actions={
          <ConfirmButton
            action={deleteRecord.bind(null, { path: `nav-links/${id}/`, redirectTo: "/admin/nav-links", message: "Link deleted." })}
            label="Delete"
            title="Delete this link?"
            body={<p>It disappears from the header and the footer straight away. Hide it instead if you may want it back.</p>}
            confirmLabel="Yes, delete it"
          />
        }
      />
      <NavLinkForm action={submitRecord.bind(null, { path: `nav-links/${id}/`, method: "PATCH", redirectTo: `/admin/nav-links/${id}`, message: "Link saved." })} initial={link} cancelHref="/admin/nav-links" />
    </div>
  );
}
