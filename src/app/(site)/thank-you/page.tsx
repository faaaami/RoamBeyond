import { Check, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { pageMetadata } from "@/lib/seo";
import { defaultWhatsappLink } from "@/lib/whatsapp";
import { getPageSeo, getPagesText, getSiteSettings } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("/thank-you");
  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: "/thank-you",
  });
}

export default async function ThankYouPage() {
  const [site, pages] = await Promise.all([getSiteSettings(), getPagesText()]);
  const text = pages.thankYou;

  return (
    <section className="container-page flex flex-col items-center py-16 text-center md:py-28">
      <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green text-white ring-8 ring-mist">
        <Check className="h-10 w-10" strokeWidth={3} aria-hidden="true" />
      </span>
      <h1 className="mt-8 text-4xl font-extrabold leading-tight md:text-6xl">
        {text.title}
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
        {text.text}
      </p>

      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
        <Link href="/packages" className={buttonClass("primary", "lg")}>
          Keep browsing packages
        </Link>
        <Link href="/" className={buttonClass("outline", "lg")}>
          Back to home
        </Link>
      </div>

      <div className="mt-12 w-full max-w-xl rounded-xl border border-line bg-white p-6">
        <h2 className="text-xl font-bold">{text.hurryTitle}</h2>
        <p className="mt-1 text-muted">{text.hurryText}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href={`tel:${site.phone.href}`} className={buttonClass("dark", "md")}>
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call {site.phone.display}
          </a>
          <a
            href={defaultWhatsappLink(site.whatsapp.number)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("whatsapp", "md")}
          >
            <WhatsAppIcon className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
