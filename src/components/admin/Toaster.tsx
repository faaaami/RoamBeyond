"use client";

import { CheckCircle2, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FLASH_COOKIE } from "@/lib/admin/flash";

function takeFlash(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${FLASH_COOKIE}=([^;]*)`));
  if (!match) return null;
  document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/`;
  return decodeURIComponent(decodeURIComponent(match[1]));
}

/**
 * Shows the success message a Server Action left in a cookie ("Package saved")
 * after it redirected, then removes the cookie. Uses navigation hooks: render
 * inside <Suspense>.
 */
export function Toaster() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Saves redirect with ?saved=1 so this runs even when the page did not change.
    if (!new URLSearchParams(window.location.search).has("saved")) return;
    const next = takeFlash();
    const params = new URLSearchParams(window.location.search);
    params.delete("saved");
    const rest = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (rest ? `?${rest}` : ""));
    if (!next) return;
    // Reading the cookie is a side effect of navigation; showing it is the point.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessage(next);
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [pathname, search]);

  return (
    // Under the top bar, not at the bottom: it must never cover the sticky Save button.
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4 md:justify-end md:px-8">
      {message && (
        <div className="pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border border-green/20 bg-ink px-4 py-3 text-white shadow-lift">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cream" aria-hidden="true" />
          <p className="font-medium">{message}</p>
          <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss" className="-mr-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
