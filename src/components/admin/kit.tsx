import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Small building blocks shared by every admin page. They use the website's
 * tokens (green, ink, cream, paper, line, muted) and its card style.
 */

/** Page title row: eyebrow, heading, optional description and action buttons. */
export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-muted">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** A white card with the website's border and radius. */
export function Card({
  title,
  action,
  flush = false,
  className,
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  /** No inner padding: for tables and lists that run edge to edge. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-line bg-white", !flush && "p-5 md:p-6", className)}>
      {(title || action) && (
        <div
          className={cn(
            "flex items-center justify-between gap-3",
            flush ? "border-b border-line px-5 py-4 md:px-6" : "mb-4",
          )}
        >
          {title && <h2 className="text-xl font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

type Tone = "plain" | "green" | "alert";

/** A number with a label. Links somewhere when `href` is given. */
export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  note,
  tone = "plain",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  note?: string;
  tone?: Tone;
}) {
  const body = (
    <>
      <span
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg",
          tone === "green" ? "bg-white/15 text-cream" : tone === "alert" ? "bg-danger/10 text-danger" : "bg-mist text-green",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="mt-4 font-display text-4xl font-extrabold leading-none tabular-nums">{value}</span>
      <span className={cn("mt-2 font-semibold", tone === "green" ? "text-white" : "text-ink")}>{label}</span>
      {note && <span className={cn("mt-0.5 text-sm", tone === "green" ? "text-white/80" : "text-muted")}>{note}</span>}
    </>
  );
  const className = cn(
    "flex h-full flex-col rounded-xl border p-5",
    tone === "green" && "border-green bg-green text-white",
    tone === "alert" && "border-danger/40 bg-white",
    tone === "plain" && "border-line bg-white",
    href && "transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card",
    href && tone === "plain" && "hover:border-green",
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Shown instead of a list or table when there is nothing to show. */
export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "px-4 py-8" : "px-6 py-14")}>
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-mist text-green">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-4 text-lg font-semibold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-md text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
