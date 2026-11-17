import { siteConfig } from "@/config/site";
import { enquiryLines, enquiryTitles, type Enquiry } from "./enquiry-schema";

/**
 * Builds a wa.me link that opens WhatsApp with the given text pre-filled.
 * `number` is the agency's WhatsApp number from Site settings (digits only).
 */
export function whatsappLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function defaultWhatsappLink(number: string): string {
  return whatsappLink(number, `Hi ${siteConfig.name}, I would like to know more about your tour packages.`);
}

/** Turns whatever the visitor has typed so far into a readable WhatsApp message. */
export function enquiryWhatsappLink(
  number: string,
  data: Partial<Enquiry> & { kind: Enquiry["kind"] },
): string {
  const lines = enquiryLines(data).map(([label, value]) => `${label}: ${value}`);
  const text = [`Hi ${siteConfig.name}, ${enquiryTitles[data.kind].toLowerCase()}:`, ...lines].join(
    "\n",
  );
  return whatsappLink(number, text);
}
