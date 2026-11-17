import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { pageMetadata } from "@/lib/seo";
import { getPageSeo, getPhotoCredits } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("/credits");
  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: "/credits",
  });
}

const licenceLinks: Record<string, string> = {
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  FAL: "https://artlibre.org/licence/lal/en/",
};

export default async function CreditsPage() {
  const credits = await getPhotoCredits();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Photo credits" }]}
        title="Photo credits"
        lead="Some photographs on this site come from Wikimedia Commons. They have been resized and cropped to fit, and are used under the licences listed here."
      />
      <section className="container-page max-w-4xl py-10 md:py-16">
        <ul className="flex flex-col gap-3">
          {credits.map((credit) => (
            <li key={credit.id} className="rounded-lg border border-line bg-white p-4 md:p-5">
              <p className="font-semibold leading-snug">
                <a
                  href={credit.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center break-all text-green underline underline-offset-2 md:min-h-0"
                >
                  {credit.title}
                </a>
              </p>
              <p className="mt-1 text-muted">
                Photo by {credit.author || "unknown author"}, licensed under{" "}
                {licenceLinks[credit.licence] ? (
                  <a
                    href={licenceLinks[credit.licence]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-green underline underline-offset-2"
                  >
                    {credit.licence}
                  </a>
                ) : (
                  credit.licence
                )}
                .
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
