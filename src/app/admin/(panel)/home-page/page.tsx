import { HomePageForm } from "@/components/admin/forms/PageForms";
import { PageTitle } from "@/components/admin/kit";
import { submitRecord } from "@/lib/admin/actions";
import { adminFetch, getOptions } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Home page" };

export default async function HomePage() {
  const [home, options] = await Promise.all([
    adminFetch<Record<string, unknown>>("pages/home/", { returnTo: "/admin/home-page" }),
    getOptions("/admin/home-page"),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Website pages" title="Home page" description="The banner, section headings, how-it-works steps and the scroll story." />
      <HomePageForm
        action={submitRecord.bind(null, { path: "pages/home/", method: "PATCH", redirectTo: "/admin/home-page", message: "Home page saved." })}
        initial={home}
        options={options}
      />
    </div>
  );
}
