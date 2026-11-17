"use client";

import { ErrorPanel } from "@/components/ErrorPanel";

/** Errors on public pages, shown inside the site header and footer. */
export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorPanel error={error} retry={retry} />;
}
