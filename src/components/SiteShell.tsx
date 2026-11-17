import { getDestinations, getNavLinks, getSiteSettings, getTripTypes, getVocabulary } from "@/lib/content";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { SiteProvider } from "./SiteProvider";
import { WhatsAppButton } from "./WhatsAppButton";

/**
 * The public website frame: header, footer and floating WhatsApp button.
 */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  // Agency details and the destination list come from the backend and are shared
  // with client components (header, forms, filters) through SiteProvider.
  const [settings, destinations, navLinks, tripTypes, vocabulary] = await Promise.all([
    getSiteSettings(),
    getDestinations(),
    getNavLinks(),
    getTripTypes(),
    getVocabulary(),
  ]);
  const site = {
    settings,
    destinations: destinations.map(({ slug, name }) => ({ slug, name })),
    navLinks,
    tripTypes,
    vocabulary,
  };

  return (
    <SiteProvider value={site}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cream focus:px-5 focus:py-3 focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </SiteProvider>
  );
}
