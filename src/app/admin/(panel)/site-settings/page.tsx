import { SiteSettingsForm } from "@/components/admin/forms/PageForms";
import { PageTitle } from "@/components/admin/kit";
import { submitRecord } from "@/lib/admin/actions";
import { adminFetch } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Site settings" };

export default async function SiteSettingsPage() {
  const settings = await adminFetch<Record<string, unknown>>("pages/site-settings/", { returnTo: "/admin/site-settings" });
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Website pages" title="Site settings" description="Phone, email, address, prices and policies. Empty fields fall back to the wording on the website." />
      <SiteSettingsForm
        action={submitRecord.bind(null, { path: "pages/site-settings/", method: "PATCH", redirectTo: "/admin/site-settings", message: "Site settings saved." })}
        initial={settings}
      />
    </div>
  );
}
