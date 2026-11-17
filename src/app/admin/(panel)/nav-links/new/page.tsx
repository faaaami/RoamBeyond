import { NavLinkForm } from "@/components/admin/forms/PageForms";
import { PageTitle } from "@/components/admin/kit";
import { submitRecord } from "@/lib/admin/actions";

export const metadata = { title: "New link" };

export default function NewNavLink() {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Navigation" title="New link" />
      <NavLinkForm
        action={submitRecord.bind(null, { path: "nav-links/", method: "POST", redirectTo: "/admin/nav-links", message: "Link added." })}
        initial={{ label: "", href: "/", position: 0, isPublished: true }}
        cancelHref="/admin/nav-links"
      />
    </div>
  );
}
