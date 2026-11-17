import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/admin/site";
import { cn } from "@/lib/utils";

/** The brand logo, the same image as the website (public/images/Logo.jpg). */
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

export function Logo({ light = false, href = "/admin" }: { light?: boolean; href?: string }) {
  return (
    <Link
      href={href}
      aria-label={`${siteConfig.name} admin home`}
      className={cn("inline-flex min-h-11 items-center gap-2.5 font-display text-lg font-extrabold tracking-tight", light ? "text-white" : "text-ink")}
    >
      <LogoMark />
      <span className="whitespace-nowrap">{siteConfig.name}</span>
    </Link>
  );
}
