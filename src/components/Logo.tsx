import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Text logo with a small route mark. Swap the SVG for your own logo file when you have one. */
export function Logo({ light = false, onClick }: { light?: boolean; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label={`${siteConfig.name} home`}
      className={cn(
        "inline-flex min-h-11 items-center gap-2.5 font-display text-lg font-extrabold tracking-tight",
        light ? "text-white" : "text-ink",
      )}
    >
      <LogoMark />
      <span className="whitespace-nowrap">{siteConfig.name}</span>
    </Link>
  );
}

/** The brand logo (public/images/Logo.jpg). Shown in the header, footer and admin. */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <Image
      src="/images/Logo.jpg"
      alt=""
      width={36}
      height={36}
      className={cn(className, "shrink-0 rounded-[10px] object-cover")}
    />
  );
}
