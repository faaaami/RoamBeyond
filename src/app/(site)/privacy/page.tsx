import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { pageMetadata } from "@/lib/seo";
import { getLegalPage, getPageSeo } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("/privacy");
  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: "/privacy",
  });
}

/** The text is edited in the Django admin under Website pages > Legal pages. */
export default async function PrivacyPage() {
  const content = await getLegalPage("privacy");
  return <LegalPage crumb={content.title} content={content} />;
}
