import { ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { PackageSummary } from "@/data/types";
import { formatDuration, formatPrice } from "@/lib/packages";
import { Tag } from "./ui/Tag";

/**
 * Hover: card lifts 6px and the photo zooms to 1.06 over 0.5s. CSS transforms only.
 * The whole card is one link (the title link is stretched over it).
 */
export function PackageCard({ pkg, priority = false }: { pkg: PackageSummary; priority?: boolean }) {
  const category = pkg.categoryLabel;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-card transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lift focus-within:-translate-y-1.5">
      <div className="relative aspect-[4/3] overflow-hidden bg-mist">
        <Image
          src={pkg.cover}
          alt={pkg.coverAlt}
          fill
          loading={priority ? "eager" : "lazy"}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
        <div className="absolute left-4 top-4 flex gap-2">
          <Tag tone="cream">{formatDuration(pkg)}</Tag>
          {category && <Tag tone="white">{category}</Tag>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        {pkg.destinationName && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {pkg.destinationName}
          </p>
        )}
        <h3 className="mt-1.5 text-xl font-bold leading-snug md:text-[1.375rem]">
          <Link href={`/packages/${pkg.slug}`} className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-green">
            {pkg.name}
          </Link>
        </h3>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{pkg.summary}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">From</p>
            <p className="font-display text-xl font-extrabold text-green">
              {formatPrice(pkg.priceFrom)}
              <span className="font-sans text-sm font-normal text-muted"> / person</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-green">
            View trip
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </article>
  );
}
