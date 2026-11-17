"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { buttonClass } from "./ui/button";

/**
 * The shared fallback for error boundaries. Server errors reach the browser
 * as a generic message with a `digest` that matches the server log, so the
 * digest is shown as a reference the visitor can quote.
 */
export function ErrorPanel({
  error,
  retry,
  title = "Something went wrong",
  text = "This page did not load properly. It is usually temporary.",
  links = [
    { href: "/", label: "Go to home" },
    { href: "/contact", label: "Contact us" },
  ],
}: {
  error: unknown;
  retry: () => void;
  title?: string;
  text?: string;
  links?: { href: string; label: string }[];
}) {
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : undefined;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section role="alert" className="container-page flex flex-col items-center py-20 text-center md:py-28">
      <p className="font-display text-7xl font-extrabold leading-none text-green md:text-8xl">Oops</p>
      <h1 className="mt-4 text-3xl font-extrabold md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-lg text-lg text-muted">{text}</p>
      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
        <button type="button" onClick={() => retry()} className={buttonClass("primary", "lg")}>
          <RotateCw className="h-5 w-5" aria-hidden="true" />
          Try again
        </button>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={buttonClass("outline", "lg")}>
            {l.label}
          </Link>
        ))}
      </div>
      {digest && <p className="mt-8 text-sm text-muted">Reference: {digest}</p>}
    </section>
  );
}
