"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { defaultWhatsappLink } from "@/lib/whatsapp";
import { Logo } from "./Logo";
import { useSite } from "./SiteProvider";
import { buttonClass } from "./ui/button";
import { WhatsAppIcon } from "./ui/WhatsAppIcon";

export function Header() {
  const { settings: site, navLinks } = useSite();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  // Lock page scroll, move focus into the drawer and close on Escape.
  useEffect(() => {
    if (!open) return;
    const opener = openRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-4 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-mist hover:text-green"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {/* Phone icon only: tapping it starts a call. The number itself is on the contact page. */}
          <a
            href={`tel:${site.phone.href}`}
            aria-label="Call us"
            title="Call us"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-green transition-colors hover:bg-mist"
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
          </a>
          <div className="hidden sm:block">
            <Link href="/plan-my-trip" className={buttonClass("primary", "md")}>
              Enquire now
            </Link>
          </div>
          <button
            ref={openRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-mist lg:hidden"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile drawer. Slides in from the right: 0.3s ease-out, transform only. */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-ink/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              onClick={close}
              aria-hidden="true"
            />
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-green text-white"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={reduce ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-16 items-center justify-between px-5">
                <Logo light onClick={close} />
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10"
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-4">
                <ul className="flex flex-col">
                  {navLinks.map((link) => (
                    <li key={link.href} className="border-b border-white/15">
                      <Link
                        href={link.href}
                        onClick={close}
                        className="flex min-h-14 items-center font-display text-2xl font-bold"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="flex flex-col gap-3 border-t border-white/15 p-5">
                <Link href="/plan-my-trip" onClick={close} className={buttonClass("cream", "lg")}>
                  Enquire now
                </Link>
                <a href={`tel:${site.phone.href}`} className={buttonClass("outlineLight", "lg")}>
                  <Phone className="h-5 w-5" aria-hidden="true" />
                  Call us
                </a>
                <a
                  href={defaultWhatsappLink(site.whatsapp.number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("whatsapp", "lg")}
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Chat on WhatsApp
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
