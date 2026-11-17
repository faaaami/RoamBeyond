import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/** Consistent title, description, canonical URL and Open Graph tags for a page. */
export function pageMetadata({
  title,
  description,
  path,
  image = "/images/og-default.jpg",
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: siteConfig.name,
      title,
      description,
      url: path,
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
