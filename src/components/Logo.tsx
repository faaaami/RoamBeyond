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

/** The square route mark on its own. */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
      <svg viewBox="0 0 36 36" className={cn(className, "shrink-0")} aria-hidden="true">
      <rect width="36" height="36" rx="10" className="fill-green" />
      <path
        d="M9 25c4-1 5-6 9-7s5-6 9-7"
        fill="none"
        stroke="#F4ECD8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="0.1 5"
      />
      <circle cx="9" cy="25" r="3" fill="#fff" />
      <circle cx="27" cy="11" r="3.5" fill="#F4ECD8" />
    </svg>
  );
}
