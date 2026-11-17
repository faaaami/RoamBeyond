import {
  BedDouble,
  Bus,
  CalendarDays,
  Check,
  MapPin,
  Sun,
  Users,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { Gallery } from "@/components/Gallery";
import { ItineraryDay } from "@/components/ItineraryDay";
import { PackageCard } from "@/components/PackageCard";
import { Breadcrumbs } from "@/components/PageHeader";
import { SectionReveal } from "@/components/SectionReveal";
import { buttonClass } from "@/components/ui/button";
import { Tag } from "@/components/ui/Tag";
import { siteConfig } from "@/config/site";
import { formatDuration, formatPrice, getRelatedPackages } from "@/lib/packages";
import { pageMetadata } from "@/lib/seo";
import { jsonLd } from "@/lib/utils";
import { getDestination, getPackage, getPackages, getSiteSettings, getTripTypes } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

/**
 * Every package published in the admin is built as static HTML at build time.
 * Packages added later are rendered on their first visit, then cached.
 */
// No generateStaticParams: pages render on first visit and are cached, so an empty
// catalog still builds and a new package appears without a rebuild.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackage(slug);
  if (!pkg) return {};
  return pageMetadata({
    title: `${pkg.name} (${formatDuration(pkg)})`,
    description: pkg.summary,
    path: `/packages/${pkg.slug}`,
    image: pkg.cover,
  });
}

export default async function PackagePage({ params }: Props) {
  const { slug } = await params;
  const pkg = await getPackage(slug);
  if (!pkg) notFound();

  const [destination, packages, site, tripTypes] = await Promise.all([
    getDestination(pkg.destination),
    getPackages(),
    getSiteSettings(),
    getTripTypes(),
  ]);
  const category = pkg.categoryLabel;
  const related = getRelatedPackages(pkg, packages);

  const facts = [
    { icon: CalendarDays, label: "Duration", value: `${pkg.days} days, ${pkg.nights} nights` },
    { icon: MapPin, label: "Starts and ends", value: `${pkg.quickFacts.startCity} to ${pkg.quickFacts.endCity}` },
    { icon: Sun, label: "Best season", value: pkg.quickFacts.bestSeason },
    { icon: BedDouble, label: "Stay", value: pkg.quickFacts.stay },
    { icon: Bus, label: "Transport", value: pkg.quickFacts.transport },
    { icon: Users, label: "Group size", value: pkg.quickFacts.groupSize },
  ];

  const tripJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: pkg.name,
    description: pkg.overview,
    url: `${siteConfig.url}/packages/${pkg.slug}`,
    image: pkg.gallery.map((g) => g.src),
    touristType: pkg.tripTypes.map((t) => tripTypes.find((x) => x.id === t)?.label ?? t),
    provider: { "@type": "TravelAgency", name: siteConfig.name, url: siteConfig.url },
    itinerary: {
      "@type": "ItemList",
      numberOfItems: pkg.itinerary.length,
      itemListElement: pkg.itinerary.map((d) => ({
        "@type": "ListItem",
        position: d.day,
        name: `Day ${d.day}: ${d.title}`,
        description: d.description,
      })),
    },
    ...(pkg.priceFrom !== null
      ? {
          offers: {
            "@type": "Offer",
            price: pkg.priceFrom,
            priceCurrency: "INR",
            url: `${siteConfig.url}/packages/${pkg.slug}`,
          },
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(tripJsonLd) }} />

      <div className="container-page pt-3 md:pt-5">
        <Breadcrumbs crumbs={[{ label: "Packages", href: "/packages" }, { label: pkg.name }]} />

        <header className="mt-3 md:mt-5">
          <div className="flex flex-wrap gap-2">
            <Tag tone="cream">{formatDuration(pkg)}</Tag>
            {category && <Tag tone="green">{category}</Tag>}
            {pkg.tripTypes.map((t) => (
              <Tag key={t}>{tripTypes.find((x) => x.id === t)?.label}</Tag>
            ))}
          </div>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] md:text-6xl">{pkg.name}</h1>
          {destination && (
            <p className="mt-3 flex items-center gap-2 text-lg text-muted">
              <MapPin className="h-5 w-5 text-green" aria-hidden="true" />
              <Link
                href={`/destinations/${destination.slug}`}
                className="inline-flex min-h-11 items-center font-medium underline-offset-4 hover:text-green hover:underline"
              >
                {destination.name}, {destination.region}
              </Link>
            </p>
          )}
        </header>

        <div className="mt-5 md:mt-8">
          <Gallery photos={pkg.gallery} title={pkg.name} />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="flex flex-col gap-12 md:gap-16">
            <SectionReveal>
              <section aria-labelledby="overview">
                <h2 id="overview" className="text-3xl font-extrabold md:text-4xl">
                  Overview
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted">{pkg.overview}</p>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {pkg.highlights.map((h) => (
                    <li key={h} className="flex gap-3 font-medium">
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green text-white">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </section>
            </SectionReveal>

            <SectionReveal>
              <section aria-labelledby="facts">
                <h2 id="facts" className="text-3xl font-extrabold md:text-4xl">
                  Quick facts
                </h2>
                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  {facts.map((fact) => (
                    <div key={fact.label} className="flex gap-4 rounded-lg border border-line bg-white p-4">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mist text-green">
                        <fact.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <dt className="text-sm text-muted">{fact.label}</dt>
                        <dd className="font-semibold leading-snug">{fact.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </section>
            </SectionReveal>

            <section aria-labelledby="itinerary">
              <h2 id="itinerary" className="text-3xl font-extrabold md:text-4xl">
                Day-wise itinerary
              </h2>
              <p className="mt-2 text-muted">Tap a day to see the plan. Timings can shift with weather and traffic.</p>
              <ol className="mt-6">
                {pkg.itinerary.map((day) => (
                  <ItineraryDay key={day.day} day={day} defaultOpen={day.day === 1} />
                ))}
              </ol>
            </section>

            <SectionReveal>
              <section aria-labelledby="inclusions" className="grid gap-5 md:grid-cols-2">
                <h2 id="inclusions" className="text-3xl font-extrabold md:col-span-2 md:text-4xl">
                  What is included
                </h2>
                <div className="rounded-xl border border-line bg-white p-6">
                  <h3 className="text-xl font-bold">Included</h3>
                  <ul className="mt-4 flex flex-col gap-3">
                    {pkg.inclusions.map((item) => (
                      <li key={item} className="flex gap-3">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-green" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-line bg-white p-6">
                  <h3 className="text-xl font-bold">Not included</h3>
                  <ul className="mt-4 flex flex-col gap-3 text-muted">
                    {pkg.exclusions.map((item) => (
                      <li key={item} className="flex gap-3">
                        <X className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </SectionReveal>

            <SectionReveal>
              <section aria-labelledby="cancellation">
                <h2 id="cancellation" className="text-3xl font-extrabold md:text-4xl">
                  Cancellation terms
                </h2>
                <ul className="mt-5 flex list-disc flex-col gap-2 pl-5 leading-relaxed text-muted marker:text-green">
                  {site.cancellationTerms.map((term) => (
                    <li key={term}>{term}</li>
                  ))}
                </ul>
                <p className="mt-4 text-muted">
                  Full details are in our{" "}
                  <Link href="/terms" className="font-semibold text-green underline underline-offset-2">
                    terms
                  </Link>
                  . Our team confirms the exact policy for your dates on the call.
                </p>
              </section>
            </SectionReveal>
          </div>

          {/* Sticky enquiry form: sits beside the content on desktop, below it on mobile */}
          <aside id="enquire" aria-labelledby="enquire-title" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl bg-white p-5 shadow-card md:p-6">
              <p className="text-sm font-medium uppercase tracking-wide text-muted">Starting from</p>
              <p className="font-display text-4xl font-extrabold text-green">
                {formatPrice(pkg.priceFrom)}
                <span className="font-sans text-base font-normal text-muted"> / person</span>
              </p>
              <h2 id="enquire-title" className="mt-4 border-t border-line pt-4 text-2xl font-bold">
                Enquire about this trip
              </h2>
              <div className="mt-4">
                <EnquiryForm packageName={pkg.name} packageSlug={pkg.slug} />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <section className="mx-3 rounded-xl md:mx-5 mb-3 mt-16 bg-mist py-14 md:mb-5 md:mt-24 md:py-20">
        <div className="container-page">
          <h2 className="text-3xl font-extrabold md:text-4xl">You may also like</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {related.map((p) => (
              <li key={p.slug}>
                <PackageCard pkg={p} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mobile sticky bar: always one tap away from the enquiry form */}
      <div
        data-sticky-bar
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-5 py-3 shadow-[0_-8px_24px_-12px_rgb(14_42_40/0.25)] lg:hidden"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="leading-tight">
            <span className="block text-xs text-muted">From</span>
            <span className="font-display text-xl font-extrabold text-green">{formatPrice(pkg.priceFrom)}</span>
          </p>
          <a href="#enquire" className={buttonClass("primary", "md", "flex-1 max-w-56")}>
            Enquire now
          </a>
        </div>
      </div>
      {/* Spacer so the sticky bar never covers the footer on mobile */}
      <div aria-hidden="true" className="h-[4.25rem] bg-ink lg:hidden" />
    </>
  );
}
