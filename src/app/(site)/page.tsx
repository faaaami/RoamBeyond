import { ArrowRight, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DestinationTile } from "@/components/DestinationTile";
import { CallbackForm } from "@/components/forms/CallbackForm";
import { Hero } from "@/components/hero/Hero";
import { QuickSearch } from "@/components/hero/QuickSearch";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Marquee } from "@/components/home/Marquee";
import { Reviews } from "@/components/home/Reviews";
import { RouteMap } from "@/components/home/RouteMap";
import { ScrollProgress } from "@/components/home/ScrollProgress";
import { ScrollStory } from "@/components/home/ScrollStory";
import { TripTypes } from "@/components/home/TripTypes";
import { PackageCard } from "@/components/PackageCard";
import { SectionHeading } from "@/components/SectionHeading";
import { SectionReveal, StaggerGroup, StaggerItem } from "@/components/SectionReveal";
import { buttonClass } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { jsonLd } from "@/lib/utils";
import { getDestinations, getHomePage, getPackages, getPageSeo, getSiteSettings } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const [site, seo] = await Promise.all([getSiteSettings(), getPageSeo("/")]);
  return {
    ...pageMetadata({ title: seo.title, description: site.description, path: "/" }),
    // The home page uses the full title rather than the "%s | name" template.
    title: { absolute: seo.title },
  };
}

export default async function HomePage() {
  const [site, home, destinations, packages] = await Promise.all([
    getSiteSettings(),
    getHomePage(),
    getDestinations(),
    getPackages(),
  ]);
  const featuredPackages = packages.filter((p) => p.featured);
  const popularDestinations = destinations.filter((d) => d.popular);

  const travelAgencyJsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: siteConfig.name,
    description: site.description,
    url: siteConfig.url,
    image: `${siteConfig.url}/images/og-default.jpg`,
    telephone: site.phone.href,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.display,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    },
    areaServed: { "@type": "Country", name: "India" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(travelAgencyJsonLd) }} />

      <ScrollProgress />

      <Hero text={home.hero} search={<QuickSearch />} />

      <TripTypes heading={home.tripTypes} />

      <ScrollStory scenes={home.scenes} />

      <section className="mx-3 rounded-xl md:mx-5 bg-mist py-14 md:py-20">
        <div className="container-page">
          <SectionReveal>
            <SectionHeading
              eyebrow={home.featured.eyebrow}
              title={home.featured.title}
              lead={home.featured.lead}
              action={
                <Link href="/packages" className={buttonClass("outline", "md", "self-start md:self-auto")}>
                  All packages
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              }
            />
          </SectionReveal>
          <StaggerGroup className="mt-8 grid gap-5 sm:grid-cols-2 md:mt-10 lg:grid-cols-3 lg:gap-6">
            {featuredPackages.slice(0, 6).map((pkg) => (
              <StaggerItem key={pkg.slug} className="h-full">
                <PackageCard pkg={pkg} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <Marquee names={home.marquee} />

      <section className="container-page py-16 md:py-24">
        <SectionReveal>
          <SectionHeading
            eyebrow={home.destinations.eyebrow}
            title={home.destinations.title}
            action={
              <Link href="/destinations" className={buttonClass("outline", "md", "self-start md:self-auto")}>
                All destinations
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
        </SectionReveal>
        {/* Bento grid: the first tile is large, the sixth is wide, the rest are single cells. */}
        <StaggerGroup className="mt-8 grid auto-rows-[11rem] grid-cols-2 gap-3 md:mt-10 md:auto-rows-[13.5rem] md:gap-4 lg:grid-cols-4">
          {popularDestinations.slice(0, 8).map((destination, i) => (
            <StaggerItem
              key={destination.slug}
              effect="scale"
              className={
                i === 0 ? "col-span-2 lg:row-span-2" : i === 5 ? "col-span-2" : undefined
              }
            >
              <DestinationTile
                destination={destination}
                packageCount={destination.packageCount}
                className="aspect-auto h-full"
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      <RouteMap heading={home.routeMap} />

      <HowItWorks content={home.howItWorks} />

      <Reviews heading={home.reviews} />

      <section id="callback" className="mx-3 rounded-xl md:mx-5 mb-3 scroll-mt-24 bg-green py-14 text-white md:mb-5 md:py-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionReveal>
            <SectionHeading
              light
              eyebrow={home.callback.eyebrow}
              title={home.callback.title}
              lead={home.callback.lead}
            />
            <a
              href={`tel:${site.phone.href}`}
              className="mt-6 inline-flex min-h-11 items-center gap-3 font-display text-2xl font-bold text-white hover:text-cream"
            >
              <Phone className="h-6 w-6 text-cream" aria-hidden="true" />
              {site.phone.display}
            </a>
            <p className="mt-1 text-white/85">{home.callback.callNow}</p>
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <CallbackForm />
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
