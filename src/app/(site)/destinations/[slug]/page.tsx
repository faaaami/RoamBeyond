import { Sun } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnquiryCta } from "@/components/EnquiryCta";
import { PackageCard } from "@/components/PackageCard";
import { PageHeader } from "@/components/PageHeader";
import { SectionReveal } from "@/components/SectionReveal";
import { buttonClass } from "@/components/ui/button";
import { Tag } from "@/components/ui/Tag";
import { pageMetadata } from "@/lib/seo";
import { getDestination, getDestinations, getPackages } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const destinations = await getDestinations();
  return destinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) return {};
  return pageMetadata({
    title: `${destination.name} tour packages`,
    description: `${destination.tagline}. ${destination.description}`.slice(0, 158),
    path: `/destinations/${destination.slug}`,
    image: destination.image,
  });
}

export default async function DestinationPage({ params }: Props) {
  const { slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) notFound();

  const destinationPackages = (await getPackages()).filter((p) => p.destination === destination.slug);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Destinations", href: "/destinations" }, { label: destination.name }]}
        eyebrow={destination.region}
        title={destination.name}
        lead={destination.tagline}
      />

      <section className="container-page grid gap-8 py-10 md:py-16 lg:grid-cols-2 lg:items-center lg:gap-14">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-mist">
          <Image
            src={destination.image}
            alt={`${destination.name}: ${destination.tagline}`}
            fill
            loading="eager"
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
          />
        </div>
        <SectionReveal>
          <h2 className="text-3xl font-extrabold md:text-4xl">About {destination.name}</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">{destination.description}</p>
          <p className="mt-5 flex items-start gap-3 font-medium">
            <Sun className="mt-0.5 h-5 w-5 shrink-0 text-green" aria-hidden="true" />
            <span>
              <span className="text-muted">Best time to visit: </span>
              {destination.bestSeason}
            </span>
          </p>
          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted">Known for</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {destination.knownFor.map((item) => (
              <li key={item}>
                <Tag className="h-8 text-sm">{item}</Tag>
              </li>
            ))}
          </ul>
        </SectionReveal>
      </section>

      <section className="mx-3 rounded-xl md:mx-5 mb-3 bg-mist py-14 md:mb-5 md:py-20">
        <div className="container-page">
          <h2 className="text-3xl font-extrabold md:text-4xl">Packages in {destination.name}</h2>
          {destinationPackages.length > 0 ? (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {destinationPackages.map((pkg) => (
                <li key={pkg.slug}>
                  <PackageCard pkg={pkg} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-line bg-white p-8 text-center">
              <p className="text-lg text-muted">
                We do not have a ready-made package here yet, but we can plan one for you.
              </p>
              <Link href="/plan-my-trip" className={buttonClass("primary", "md", "mt-5")}>
                Plan a custom trip
              </Link>
            </div>
          )}
        </div>
      </section>

      <EnquiryCta
        title={`Want a different plan for ${destination.name}?`}
        text="More days, fewer stops, a better hotel: tell us and we will rework the trip around you."
      />
    </>
  );
}
