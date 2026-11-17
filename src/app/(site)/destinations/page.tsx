import type { Metadata } from "next";
import { DestinationTile } from "@/components/DestinationTile";
import { EnquiryCta } from "@/components/EnquiryCta";
import { PageHeader } from "@/components/PageHeader";
import { StaggerGroup, StaggerItem } from "@/components/SectionReveal";
import { pageMetadata } from "@/lib/seo";
import { getDestinations, getPageSeo, getPagesText } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("/destinations");
  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: "/destinations",
  });
}

export default async function DestinationsPage() {
  const [destinations, pages] = await Promise.all([getDestinations(), getPagesText()]);
  const text = pages.destinations;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Destinations" }]}
        eyebrow={text.eyebrow}
        title={text.title}
        lead={text.lead}
      />
      <section className="container-page py-10 md:py-16">
        <StaggerGroup className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {destinations.map((destination, i) => (
            <StaggerItem key={destination.slug} effect="scale">
              <DestinationTile
                destination={destination}
                packageCount={destination.packageCount}
                className="md:aspect-[4/3]"
                priority={i < 6}
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>
      <EnquiryCta
        title={text.ctaTitle}
        text={text.ctaText}
      />
    </>
  );
}
