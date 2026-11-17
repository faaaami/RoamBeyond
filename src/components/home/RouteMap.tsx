import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getDestinations, type HomeContent } from "@/lib/content";
import { HeroMap } from "../hero/HeroMap";
import { SectionHeading } from "../SectionHeading";
import { SectionReveal } from "../SectionReveal";

/**
 * Green band with the animated map of India. The route draws itself and the
 * pins drop in the first time the map scrolls into view (see HeroMap).
 */
export async function RouteMap({ heading }: { heading: HomeContent["routeMap"] }) {
  const destinations = await getDestinations();

  return (
    <section className="mx-3 rounded-xl md:mx-5 my-3 overflow-hidden bg-green py-14 text-white md:my-5 md:py-20">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <SectionReveal>
          <SectionHeading
            light
            eyebrow={heading.eyebrow}
            title={heading.title}
            lead={heading.lead}
          />
          <ul className="mt-7 flex flex-wrap gap-2">
            {destinations.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/destinations/${d.slug}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/40 px-4 text-[0.9375rem] font-medium text-white transition-[transform,background-color,color] duration-150 hover:bg-cream hover:text-ink active:scale-[0.97]"
                >
                  {d.name}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </SectionReveal>
        <div className="mx-auto w-full max-w-[20rem] sm:max-w-sm lg:max-w-[28rem]">
          <HeroMap />
        </div>
      </div>
    </section>
  );
}
