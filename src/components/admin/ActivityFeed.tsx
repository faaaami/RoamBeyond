import { History, Inbox, Pencil, PlusCircle, Trash2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ActivityEvent } from "@/lib/admin/api";
import { cn } from "@/lib/utils";
import { formatDateTime, timeAgo } from "./format";
import { EmptyState } from "./kit";

const ICON: Record<ActivityEvent["action"], LucideIcon> = {
  received: Inbox,
  added: PlusCircle,
  changed: Pencil,
  deleted: Trash2,
};

const TONE: Record<ActivityEvent["action"], string> = {
  received: "bg-green text-white",
  added: "bg-mist text-green",
  changed: "bg-mist text-green",
  deleted: "bg-danger/10 text-danger",
};

function sentence(e: ActivityEvent) {
  if (e.kind === "enquiry") {
    return (
      <>
        <strong className="font-semibold text-ink">{e.who}</strong> sent a {e.detail.toLowerCase()}
        {e.what && e.what !== e.detail ? <> about <span className="text-ink">{e.what}</span></> : null}
      </>
    );
  }
  return (
    <>
      <strong className="font-semibold text-ink">{e.who}</strong> {e.action}{" "}
      <span className="text-ink">{e.what}</span>
      {e.section ? <span className="text-muted"> in {e.section}</span> : null}
    </>
  );
}

/** Staff edits made in the admin panel and incoming enquiries, newest first. */
export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        compact
        icon={History}
        title="No activity yet"
        text="Enquiries from the website and changes made by the team will appear here."
      />
    );
  }
  return (
    <ol className="divide-y divide-line">
      {events.map((e, i) => {
        const Icon = ICON[e.action];
        const content = (
          <>
            <span className={cn("mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", TONE[e.action])}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.9375rem] leading-snug text-muted">{sentence(e)}</span>
              {e.kind === "edit" && e.detail && e.action === "changed" && (
                <span className="mt-0.5 block truncate text-sm text-muted">{e.detail}</span>
              )}
              <time dateTime={e.at} title={formatDateTime(e.at)} className="mt-1 block text-xs text-muted">
                {timeAgo(e.at)}
              </time>
            </span>
          </>
        );
        return (
          <li key={`${e.at}-${i}`}>
            {e.link ? (
              <Link href={e.link} className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-paper md:px-6">
                {content}
              </Link>
            ) : (
              <div className="flex gap-3 px-5 py-3.5 md:px-6">{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
