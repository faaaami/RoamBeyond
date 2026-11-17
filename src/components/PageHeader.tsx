import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { jsonLd } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ crumbs, light = false }: { crumbs: Crumb[]; light?: boolean }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...crumbs];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${siteConfig.url}${c.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} />
      <ol className={`flex flex-wrap items-center gap-x-1 text-sm ${light ? "text-white/85" : "text-muted"}`}>
        {all.map((crumb, i) => (
          <li key={crumb.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className={`inline-flex min-h-11 items-center underline-offset-4 hover:underline md:min-h-8 ${light ? "hover:text-white" : "hover:text-green"}`}
              >
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className={`font-medium ${light ? "text-white" : "text-ink"}`}>
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Teal title band used at the top of every inner page. */
export function PageHeader({
  crumbs,
  eyebrow,
  title,
  lead,
  children,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <section className="mx-3 rounded-xl md:mx-5 mt-3 bg-green text-white md:mt-4">
      <div className="container-page pb-10 pt-4 md:pb-14 md:pt-6">
        <Breadcrumbs crumbs={crumbs} light />
        {eyebrow && <p className="eyebrow mt-6 text-cream">{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl text-4xl font-extrabold leading-[1.05] md:text-6xl">{title}</h1>
        {lead && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
