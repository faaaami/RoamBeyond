"use client";

import { ErrorPanel } from "@/components/admin/ErrorPanel";

export default function PanelError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorPanel
      error={error}
      retry={retry}
      title="This page did not load"
      text="The backend may be restarting or unreachable. Try again; if it keeps failing, quote the reference below to whoever runs the server."
      links={[
        { href: "/admin", label: "Back to the dashboard" },
        { href: "/admin/login", label: "Sign in again" },
      ]}
    />
  );
}
