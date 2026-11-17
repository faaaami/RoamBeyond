import type { LegalContent } from "@/lib/content";
import { getSiteSettings } from "@/lib/content";
import { PageHeader } from "./PageHeader";
import { RichText } from "./RichText";

/** Shared layout for the privacy policy and terms pages. The text comes from the backend. */
export async function LegalPage({ crumb, content }: { crumb: string; content: LegalContent }) {
  const site = await getSiteSettings();

  return (
    <>
      <PageHeader crumbs={[{ label: crumb }]} title={content.title} lead={content.intro} />
      <article className="container-page max-w-3xl py-10 md:py-16">
        {!content.hideTemplateNotice && (
          <p className="rounded-lg border border-line bg-mist p-4 text-sm font-medium text-ink">
            Template text. Have this page reviewed by a legal adviser and replace every [BRACKETED]
            value before the site goes live.
          </p>
        )}
        <p className="mt-6 text-sm text-muted">Last updated: {content.lastUpdated}</p>
        {content.sections.map((section, i) => (
          <section key={`${i}-${section.heading}`} className="mt-10">
            <h2 className="text-2xl font-bold md:text-3xl">{section.heading}</h2>
            <div className="mt-3 flex flex-col gap-3 text-lg leading-relaxed text-muted [&_a]:font-semibold [&_a]:text-green [&_a]:underline [&_a]:underline-offset-2 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
              <RichText text={section.body} site={site} />
            </div>
          </section>
        ))}
      </article>
    </>
  );
}
