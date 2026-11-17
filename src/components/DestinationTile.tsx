import Image from "next/image";
import Link from "next/link";
import type { Destination } from "@/data/types";
import { cn } from "@/lib/utils";

/** Photo tile with the name over a dark gradient. Hover zooms the photo to 1.06 over 0.5s. */
export function DestinationTile({
  destination,
  packageCount,
  className,
  priority = false,
}: {
  destination: Destination;
  packageCount?: number;
  className?: string;
  /** Set for tiles visible on first load, so the photo is not lazy-loaded. */
  priority?: boolean;
}) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className={cn(
        "group relative block aspect-[4/5] overflow-hidden rounded-xl bg-ink transition-transform duration-150 active:scale-[0.98]",
        className,
      )}
    >
      <Image
        src={destination.image}
        alt=""
        fill
        loading={priority ? "eager" : "lazy"}
        sizes="(min-width: 1024px) 600px, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-ink via-ink/35 to-transparent"
      />
      <span className="absolute inset-x-0 bottom-0 flex flex-col p-4 text-white md:p-5">
        <span className="font-display text-xl font-bold leading-tight md:text-2xl">
          {destination.name}
        </span>
        <span className="mt-1 text-sm text-white/90">
          {packageCount === undefined
            ? destination.tagline
            : `${packageCount} ${packageCount === 1 ? "package" : "packages"}`}
        </span>
      </span>
    </Link>
  );
}
