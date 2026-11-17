import { AboutPageForm } from "@/components/admin/forms/PageForms";
import { PageTitle } from "@/components/admin/kit";
import { submitRecord } from "@/lib/admin/actions";
import { adminFetch } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "About page" };

export default async function AboutPage() {
  const about = await adminFetch<Record<string, unknown>>("pages/about/", { returnTo: "/admin/about-page" });
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Website pages" title="About page" description="Your story, facts, values and the two photos." />
      <AboutPageForm
        action={submitRecord.bind(null, { path: "pages/about/", method: "PATCH", redirectTo: "/admin/about-page", message: "About page saved." })}
        initial={about}
      />
    </div>
  );
}
