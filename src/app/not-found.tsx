import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  // Unmatched URLs render outside the (site) route group, so add the site frame here.
  return (
    <SiteShell>
      <section className="relative isolate mx-3 rounded-xl md:mx-5 my-3 overflow-hidden bg-green text-white md:my-4">
        <svg
          aria-hidden="true"
          viewBox="0 0 800 300"
          className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 w-full -translate-y-1/2 text-white/10"
        >
          <path
            d="M-20 220 C 120 60, 240 280, 380 150 S 600 40, 640 160 S 520 300, 430 220 S 560 60, 820 120"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray="2 14"
            strokeLinecap="round"
          />
        </svg>
        <div className="container-page flex flex-col items-center py-20 text-center md:py-32">
          <p className="font-display text-8xl font-extrabold leading-none text-cream md:text-[10rem]">404</p>
          <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">This route is not on our map</h1>
          <p className="mt-4 max-w-lg text-lg text-white/90">
            The page may have moved, or the link is out of date. Let us get you back on track.
          </p>
          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Link href="/packages" className={buttonClass("cream", "lg")}>
              See packages
            </Link>
            <Link href="/" className={buttonClass("outlineLight", "lg")}>
              Go to home
            </Link>
            <Link href="/contact" className={buttonClass("outlineLight", "lg")}>
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
