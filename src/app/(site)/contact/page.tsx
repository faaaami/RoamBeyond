import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { CallbackForm } from "@/components/forms/CallbackForm";
import { PageHeader } from "@/components/PageHeader";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { defaultWhatsappLink } from "@/lib/whatsapp";
import { getPageSeo, getPagesText, getSiteSettings } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("/contact");
  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: "/contact",
  });
}

const rowClass = "flex min-h-14 items-start gap-4 rounded-lg border border-line bg-white p-4";
const iconClass = "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mist text-green";

export default async function ContactPage() {
  const [site, pages] = await Promise.all([getSiteSettings(), getPagesText()]);
  const text = pages.contact;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(site.address.mapQuery)}&output=embed`;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Contact" }]}
        eyebrow={text.eyebrow}
        title={text.title}
        lead={text.lead}
      />

      <section className="container-page grid gap-10 py-10 md:py-16 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="text-3xl font-extrabold">{text.directTitle}</h2>
          <ul className="mt-5 flex flex-col gap-3">
            <li>
              <a href={`tel:${site.phone.href}`} className={`${rowClass} transition-colors hover:border-green`}>
                <span className={iconClass}>
                  <Phone className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm text-muted">Phone</span>
                  <span className="font-semibold">{site.phone.display}</span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={defaultWhatsappLink(site.whatsapp.number)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${rowClass} transition-colors hover:border-green`}
              >
                <span className={iconClass}>
                  <WhatsAppIcon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm text-muted">WhatsApp</span>
                  <span className="font-semibold">{site.whatsapp.display}</span>
                </span>
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className={`${rowClass} transition-colors hover:border-green`}>
                <span className={iconClass}>
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm text-muted">Email</span>
                  <span className="font-semibold break-all">{site.email}</span>
                </span>
              </a>
            </li>
            <li className={rowClass}>
              <span className={iconClass}>
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm text-muted">Office</span>
                <address className="font-semibold not-italic">{site.address.display}</address>
              </span>
            </li>
            <li className={rowClass}>
              <span className={iconClass}>
                <Clock className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm text-muted">Opening hours</span>
                <span className="font-semibold">{site.hours}</span>
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-3xl font-extrabold">{text.formTitle}</h2>
          <p className="mt-2 text-muted">{text.formLead}</p>
          <div className="mt-5">
            <CallbackForm withMessage idPrefix="contact" />
          </div>
        </div>
      </section>

      <section aria-labelledby="map-title" className="container-page pb-14 md:pb-20">
        <h2 id="map-title" className="text-3xl font-extrabold">
          {text.mapTitle}
        </h2>
        <div className="mt-5 overflow-hidden rounded-xl border border-line bg-mist">
          <iframe
            title={`Map showing the ${siteConfig.name} office`}
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-80 w-full border-0 md:h-[28rem]"
          />
        </div>
      </section>
    </>
  );
}
