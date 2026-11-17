"use client";

import { ErrorPanel } from "@/components/ErrorPanel";

/** Last resort below the root layout, e.g. when the site frame itself fails to load. */
export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <main id="main" className="flex min-h-dvh items-center">
      <ErrorPanel
        error={error}
        retry={retry}
        text="We could not load this page. Please try again in a moment, or call us if it keeps happening."
      />
    </main>
  );
}
