// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

import { CheckCircle2, CircleAlert, RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Card, PageTitle } from "@/components/admin/kit";
import { formatDateTime } from "@/components/admin/format";
import { buttonClass } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin/api";
import { cn } from "@/lib/utils";

export const metadata = { title: "System health" };

type Status = "ok" | "warning" | "error";
interface Check {
  key: string;
  label: string;
  status: Status;
  detail: string;
}
interface Health {
  status: Status;
  checkedAt: string;
  environment: string;
  checks: Check[];
}

const TONE: Record<Status, { label: string; box: string; icon: typeof CheckCircle2 }> = {
  ok: { label: "Healthy", box: "bg-mist text-green", icon: CheckCircle2 },
  warning: { label: "Needs attention", box: "bg-cream text-ink", icon: TriangleAlert },
  error: { label: "Problem", box: "bg-danger/10 text-danger", icon: CircleAlert },
};

export default async function HealthPage() {
  const health = await adminFetch<Health>("health/", { returnTo: "/admin/health" });
  const overall = TONE[health.status];

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow="System"
        title="System health"
        description="Whether the parts this panel depends on are working. Reload to check again."
        actions={
          <Link href="/admin/health" className={buttonClass("outline", "md")}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Check again
          </Link>
        }
      />

      <div className={cn("flex items-center gap-4 rounded-xl border border-line bg-white p-5")} role="status">
        <span className={cn("inline-flex h-12 w-12 items-center justify-center rounded-full", overall.box)}>
          <overall.icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xl font-bold">{overall.label}</p>
          <p className="text-sm text-muted">
            {health.environment === "development" ? "Development" : "Production"} · checked {formatDateTime(health.checkedAt)}
          </p>
        </div>
      </div>

      <Card flush>
        <ul className="divide-y divide-line">
          {health.checks.map((check) => {
            const tone = TONE[check.status];
            return (
              <li key={check.key} className="flex items-start gap-4 px-5 py-4 md:px-6">
                <span className={cn("mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", tone.box)}>
                  <tone.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{check.label}</p>
                  <p className="text-sm text-muted">{check.detail}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">{tone.label}</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
