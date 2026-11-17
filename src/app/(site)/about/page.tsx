import { HandCoins, Headset, MapPinned, PencilRuler } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { EnquiryCta } from "@/components/EnquiryCta";
import { PageHeader } from "@/components/PageHeader";
import { SectionReveal, StaggerGroup, StaggerItem } from "@/components/SectionReveal";
import { pageMetadata } from "@/lib/seo";
import { getAboutPage, getPageSeo } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("/about");
  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: "/about",
  });
}

/** Icons for the values, in order. The wording comes from the admin. */
const ICONS = [Headset, PencilRuler, HandCoins, MapPinned];

/** The text and photos are edited in the Django admin under "About page". */
export default async function AboutPage() {
  const about = await getAboutPage();
  const paragraphs = about.story.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "About us" }]}
        eyebrow={about.header.eyebrow}
        title={about.header.title}
        lead={about.header.lead}
      />

      <section className="container-page grid gap-8 py-12 md:py-20 lg:grid-cols-2 lg:items-center lg:gap-14">
        <SectionReveal>
          <h2 className="text-3xl font-extrabold md:text-4xl">{about.storyTitle}</h2>
          <div className="mt-4 flex flex-col gap-4 text-lg leading-relaxed text-muted">
            {paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-4">
            {about.facts.map((fact, i) => (
              <div key={`${i}-${fact.label}`} className="rounded-lg border border-line bg-white p-4">
                <dt className="text-sm text-muted">{fact.label}</dt>
                <dd className="font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </SectionReveal>
        <div className="grid grid-cols-5 gap-3">
          <div className="relative col-span-3 aspect-[3/4] overflow-hidden rounded-xl bg-mist">
            <Image
              src={about.teamPhoto.src}
              alt={about.teamPhoto.alt}
              fill
              sizes="(min-width: 1024px) 340px, 60vw"
              className="object-cover"
            />
          </div>
          <div className="relative col-span-2 mt-10 aspect-[3/5] overflow-hidden rounded-xl bg-mist">
            <Image
              src={about.officePhoto.src}
              alt={about.officePhoto.alt}
              fill
              sizes="(min-width: 1024px) 220px, 40vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-3 rounded-xl md:mx-5 mb-3 bg-mist py-14 md:mb-5 md:py-20">
        <div className="container-page">
          <SectionReveal>
            <h2 className="max-w-xl text-3xl font-extrabold md:text-4xl">{about.valuesTitle}</h2>
          </SectionReveal>
          <StaggerGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {about.values.map((value, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
              <StaggerItem key={`${i}-${value.title}`} className="h-full">
                <div className="h-full rounded-xl bg-white p-6">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold">{value.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{value.text}</p>
                </div>
              </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      <EnquiryCta title={about.ctaTitle} />
    </>
  );
}
