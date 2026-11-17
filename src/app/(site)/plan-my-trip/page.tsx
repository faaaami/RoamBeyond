import { Phone } from "lucide-react";
import type { Metadata } from "next";
import { PlanTripForm } from "@/components/forms/PlanTripForm";
import { PageHeader } from "@/components/PageHeader";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { pageMetadata } from "@/lib/seo";
import { defaultWhatsappLink } from "@/lib/whatsapp";
import { getPageSeo, getPagesText, getSiteSettings } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("/plan-my-trip");
  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: "/plan-my-trip",
  });
}

export default async function PlanMyTripPage() {
  const [site, pages] = await Promise.all([getSiteSettings(), getPagesText()]);
  const text = pages.planTrip;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Plan my trip" }]}
        eyebrow={text.eyebrow}
        title={text.title}
        lead={text.lead}
      />
      <section className="container-page grid gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <PlanTripForm />

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl bg-green p-6 text-white md:p-7">
            <h2 className="text-2xl font-bold">{text.nextTitle}</h2>
            <ol className="mt-5 flex flex-col gap-4">
              {text.nextSteps.map((step, i) => (
                <li key={`${i}-${step}`} className="flex gap-3">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream text-sm font-bold text-ink">
                    {i + 1}
                  </span>
                  <span className="text-white/90">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-col border-t border-white/20 pt-4">
              <p className="text-sm text-white/85">{text.talkPrompt}</p>
              <a
                href={`tel:${site.phone.href}`}
                className="inline-flex min-h-11 items-center gap-3 font-semibold hover:text-cream"
              >
                <Phone className="h-5 w-5 text-cream" aria-hidden="true" />
                {site.phone.display}
              </a>
              <a
                href={defaultWhatsappLink(site.whatsapp.number)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-3 font-semibold hover:text-cream"
              >
                <WhatsAppIcon className="h-5 w-5 text-cream" />
                WhatsApp {site.whatsapp.display}
              </a>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
