import { Phone } from "lucide-react";
import Link from "next/link";
import { defaultWhatsappLink } from "@/lib/whatsapp";
import { getPagesText, getSiteSettings } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";
import { buttonClass } from "./ui/button";
import { WhatsAppIcon } from "./ui/WhatsAppIcon";

/** Closing band used on inner pages so every page ends with a way to enquire. */
export async function EnquiryCta({
  title,
  text,
}: {
  title?: string;
  text?: string;
}) {
  const [site, pages] = await Promise.all([getSiteSettings(), getPagesText()]);
  // A page can set its own wording; otherwise the banner text from the admin is used.
  const heading = title || pages.enquiryCta.title;
  const body = text || pages.enquiryCta.text;

  return (
    <section className="mx-3 rounded-xl md:mx-5 mb-3 bg-ink py-14 text-white md:mb-5 md:py-20">
      <SectionReveal className="container-page flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">{heading}</h2>
          <p className="mt-3 text-lg text-white/85">{body}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/plan-my-trip" className={buttonClass("cream", "lg")}>
            Plan a custom trip
          </Link>
          <a href={`tel:${site.phone.href}`} className={buttonClass("outlineLight", "lg")}>
            <Phone className="h-5 w-5" aria-hidden="true" />
            {site.phone.display}
          </a>
          <a
            href={defaultWhatsappLink(site.whatsapp.number)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("whatsapp", "lg")}
          >
            <WhatsAppIcon className="h-5 w-5" />
            WhatsApp
          </a>
        </div>
      </SectionReveal>
    </section>
  );
}
