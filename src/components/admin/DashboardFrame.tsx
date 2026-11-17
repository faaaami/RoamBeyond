"use client";

import { ExternalLink, HeartPulse, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { LogoMark } from "./Logo";
import { siteConfig } from "@/lib/admin/site";
import { cn } from "@/lib/utils";

/**
 * The admin panel frame: an ink sidebar (fixed on desktop, a slide-out menu on
 * mobile), a top bar and the content area. `sidebar` and `user` are server
 * components passed in as slots so they can load in parallel with the page.
 */
export function DashboardFrame({
  sidebar,
  user,
  children,
}: {
  sidebar: ReactNode;
  user: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);

  // Escape closes the mobile menu; focus returns to the button that opened it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    panel.current?.querySelector<HTMLElement>("a, button")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Following any link inside the menu closes it.
  const closeOnLink = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) setOpen(false);
  };

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* Backdrop for the mobile menu */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-ink/50 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        ref={panel}
        id="dashboard-menu"
        aria-label="Admin panel"
        onClick={closeOnLink}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-ink text-white transition-transform duration-300",
          "lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-auto lg:max-w-none lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 px-5">
          <Link href="/admin" className="inline-flex min-h-11 items-center gap-2.5 font-display text-lg font-extrabold">
            <LogoMark className="h-8 w-8" />
            {siteConfig.name}
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              menuButton.current?.focus();
            }}
            aria-label="Close menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">{sidebar}</div>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/admin/health"
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            <HeartPulse className="h-4 w-4" aria-hidden="true" />
            System health
          </Link>
          <Link
            href="/admin/account"
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            My account
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 md:px-8">
            <button
              ref={menuButton}
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="dashboard-menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-mist lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <Link href="/admin" className="inline-flex items-center gap-2 font-display font-extrabold lg:hidden">
              <LogoMark className="h-7 w-7" />
              <span className="sr-only sm:not-sr-only">{siteConfig.name}</span>
            </Link>
            <span className="hidden rounded-md bg-mist px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-green lg:inline">
              Admin panel
            </span>
            <div className="ml-auto flex items-center gap-2">
              <a
                href={siteConfig.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted transition-colors hover:bg-mist hover:text-green md:inline-flex"
              >
                View website
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              {user}
            </div>
          </div>
        </header>

        <main id="main" className="w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
