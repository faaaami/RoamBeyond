import { defaultWhatsappLink } from "@/lib/whatsapp";
import { getSiteSettings } from "@/lib/content";
import { WhatsAppIcon } from "./ui/WhatsAppIcon";

/** Floating WhatsApp button, shown on every page from the root layout. */
export async function WhatsAppButton() {
  const site = await getSiteSettings();

  return (
    <a
      href={defaultWhatsappLink(site.whatsapp.number)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="wa-fab fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0f7a45] text-white shadow-lift transition-transform duration-150 hover:scale-105 active:scale-95"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
