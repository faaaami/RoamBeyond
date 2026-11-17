import { AlarmClock, ArrowRight, Inbox, MailWarning, Sparkles, UserCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { formatMobile, timeAgo } from "@/components/admin/format";
import { sectionIcon } from "@/components/admin/icons";
import { Card, EmptyState, PageTitle, StatCard } from "@/components/admin/kit";
import { StatusPill } from "@/components/admin/StatusPill";
import { buttonClass } from "@/components/ui/button";
import { adminFetch, getMe, type Stats } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home />
    </Suspense>
  );
}

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()),
  );
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

async function Home() {
  const [stats, me] = await Promise.all([adminFetch<Stats>("stats/", { returnTo: "/admin" }), getMe()]);
  const { counts } = stats;
  const totalLeads = stats.byStatus.reduce((sum, s) => sum + s.count, 0);
  const summary = counts
    ? counts.due > 0
      ? `${counts.due} follow-up${counts.due === 1 ? " is" : "s are"} due. Start there.`
      : counts.new > 0
        ? `${counts.new} new enquir${counts.new === 1 ? "y is" : "ies are"} waiting for a call.`
        : "You are all caught up."
    : "Here is what is on the website today.";

  return (
    <div className="flex flex-col gap-8">
      <PageTitle
        eyebrow="Dashboard"
        title={`${greeting()}, ${me.name.split(" ")[0]}`}
        description={summary}
        actions={
          counts && (
            <Link href="/admin/enquiries" className={buttonClass("primary", "md")}>
              Open enquiries
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )
        }
      />

      {counts && counts.emailFailed > 0 && (
        <p role="status" className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          <MailWarning className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            <strong>{counts.emailFailed}</strong> enquir{counts.emailFailed === 1 ? "y" : "ies"} could not be emailed to
            the team. They are safe here; open one and use “Resend email”, or check RESEND_API_KEY on the backend.
          </span>
        </p>
      )}

      {counts && (
        <section aria-labelledby="needs-action">
          <h2 id="needs-action" className="sr-only">
            Needs action
          </h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            <li>
              <StatCard tone="green" icon={Sparkles} label="New enquiries" value={counts.new} note={`${counts.thisWeek} received this week`} href="/admin/enquiries?view=new" />
            </li>
            <li>
              <StatCard
                tone={counts.due > 0 ? "alert" : "plain"}
                icon={AlarmClock}
                label="Follow-ups due"
                value={counts.due}
                note={`${counts.unassigned} open and unassigned`}
                href="/admin/enquiries?view=due"
              />
            </li>
            <li>
              <StatCard icon={UserCheck} label="Assigned to you" value={counts.mine} note={`${counts.convertedThisMonth} converted in 30 days`} href="/admin/enquiries?view=mine" />
            </li>
          </ul>
        </section>
      )}

      {stats.totals.length > 0 && (
        <section aria-labelledby="records">
          <h2 id="records" className="text-xl font-bold">
            Records
          </h2>
          <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
            {stats.totals.map((t) => (
              <li key={t.key}>
                <StatCard icon={sectionIcon(t.icon)} label={t.title} value={t.count} href={`/admin/${t.key}`} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {counts && (
            <Card title="Latest enquiries" flush action={<Link href="/admin/enquiries?view=all" className="text-sm font-semibold text-green hover:underline">See all</Link>}>
              {stats.recentEnquiries.length > 0 ? (
                <ul className="divide-y divide-line">
                  {stats.recentEnquiries.map((e) => (
                    <li key={e.reference}>
                      <Link href={`/admin/enquiries/${e.reference}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-paper md:px-6">
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-ink">{e.name}</span>
                          <span className="block truncate text-sm text-muted">
                            {formatMobile(e.mobile)} · {e.summary || e.kindLabel}
                          </span>
                        </span>
                        <StatusPill status={e.status} label={e.statusLabel} className="hidden sm:inline-flex" />
                        <span className="w-20 shrink-0 text-right text-sm text-muted">{timeAgo(e.createdAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact icon={Inbox} title="No enquiries yet" text="They appear here the moment a traveller sends a form on the website." />
              )}
            </Card>
          )}
          <Card title="Recent activity" flush>
            <ActivityFeed events={stats.activity} />
          </Card>
        </div>

        {counts && (
          <div className="flex flex-col gap-6">
            <Card title="Pipeline">
              <ul className="flex flex-col gap-3">
                {stats.byStatus.map((s) => (
                  <li key={s.status}>
                    <Link href={`/admin/enquiries?view=all&status=${s.status}`} className="block rounded-md hover:bg-paper">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{s.label}</span>
                        <span className="tabular-nums text-muted">{s.count}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist" aria-hidden="true">
                        <div
                          className="h-full rounded-full bg-green"
                          style={{ width: `${totalLeads ? Math.max((s.count / totalLeads) * 100, s.count ? 4 : 0) : 0}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Most enquired, 30 days">
              {stats.topPackages.length > 0 ? (
                <ol className="flex flex-col gap-2">
                  {stats.topPackages.map((p, i) => (
                    <li key={p.slug || p.name} className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mist text-xs font-bold text-green">{i + 1}</span>
                      <span className="flex-1 truncate font-medium">{p.name}</span>
                      <span className="tabular-nums text-sm text-muted">{p.count}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted">No package enquiries in the last 30 days.</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex animate-shimmer flex-col gap-8" aria-busy="true" aria-label="Loading the dashboard">
      <div className="h-20 w-2/3 rounded-xl bg-mist" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-36 rounded-xl bg-mist" />
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-36 rounded-xl bg-mist" />
        ))}
      </div>
      <div className="h-96 rounded-xl bg-mist" />
    </div>
  );
}
