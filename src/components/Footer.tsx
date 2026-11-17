import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { defaultWhatsappLink } from "@/lib/whatsapp";
import { getDestinations, getNavLinks, getSiteSettings, getTripTypes } from "@/lib/content";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./ui/WhatsAppIcon";

const linkClass =
  "inline-flex min-h-11 items-center text-white/80 transition-colors hover:text-cream md:min-h-9";

export async function Footer() {
  const [site, destinations, navLinks, tripTypes] = await Promise.all([
    getSiteSettings(),
    getDestinations(),
    getNavLinks(),
    getTripTypes(),
  ]);
  const popularDestinations = destinations.filter((d) => d.popular);

  return (
    <footer className="bg-ink text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:py-20">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-white/80">{site.description}</p>
        </div>

        <nav aria-label="Footer">
          <h2 className="eyebrow text-cream">Explore</h2>
          <ul className="mt-3">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Destinations and trip types">
          <h2 className="eyebrow text-cream">Destinations</h2>
          <ul className="mt-3">
            {popularDestinations.slice(0, 5).map((d) => (
              <li key={d.slug}>
                <Link href={`/destinations/${d.slug}`} className={linkClass}>
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="eyebrow mt-6 text-cream">Trip types</h2>
          <ul className="mt-3 flex flex-wrap gap-x-4">
            {tripTypes.map((t) => (
              <li key={t.id}>
                <Link href={`/packages?type=${t.id}`} className={linkClass}>
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow text-cream">Talk to us</h2>
          <ul className="mt-3 flex flex-col">
            <li>
              <a href={`tel:${site.phone.href}`} className={`${linkClass} gap-3`}>
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                {site.phone.display}
              </a>
            </li>
            <li>
              <a
                href={defaultWhatsappLink(site.whatsapp.number)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkClass} gap-3`}
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                WhatsApp {site.whatsapp.display}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className={`${linkClass} gap-3`}>
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                {site.email}
              </a>
            </li>
            <li className="flex gap-3 py-2 text-white/80">
              <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
              <address className="not-italic">{site.address.display}</address>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-white/75 md:flex-row md:items-center md:justify-between">
          <p>
            © {siteConfig.name}. All rights reserved. No online payments are taken on this website.
          </p>
          <ul className="flex flex-wrap gap-x-6">
            <li>
              <Link href="/privacy" className={linkClass}>
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className={linkClass}>
                Terms
              </Link>
            </li>
            <li>
              <Link href="/credits" className={linkClass}>
                Photo credits
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
