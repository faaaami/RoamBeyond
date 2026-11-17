import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getDestinations, getPackages } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packages, destinations] = await Promise.all([getPackages(), getDestinations()]);
  const url = (path: string) => `${siteConfig.url}${path}`;

  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/packages"), changeFrequency: "weekly", priority: 0.9 },
    { url: url("/destinations"), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/plan-my-trip"), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/about"), changeFrequency: "yearly", priority: 0.5 },
    { url: url("/contact"), changeFrequency: "yearly", priority: 0.6 },
    { url: url("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/terms"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/credits"), changeFrequency: "yearly", priority: 0.1 },
    ...packages.map((p) => ({
      url: url(`/packages/${p.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...destinations.map((d) => ({
      url: url(`/destinations/${d.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
