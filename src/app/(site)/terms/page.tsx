import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { pageMetadata } from "@/lib/seo";
import { getLegalPage, getPageSeo } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("/terms");
  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: "/terms",
  });
}

/** The text is edited in the Django admin under Website pages > Legal pages. */
export default async function TermsPage() {
  const content = await getLegalPage("terms");
  return <LegalPage crumb="Terms" content={content} />;
}
