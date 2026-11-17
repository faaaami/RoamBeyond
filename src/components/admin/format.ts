import type { EnquiryStatus } from "@/lib/admin/api";

const TZ = "Asia/Kolkata";

/** "12 Dec 2026, 4:05 pm" in India time. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "12 Dec 2026" for date-only values such as "2026-12-12". */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** "5 min ago", "3 h ago", "2 days ago", then a date. */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(new Date(iso).toISOString().slice(0, 10));
}

/** Today in India as YYYY-MM-DD, for comparing follow-up dates. */
export function todayInIndia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export const statusStyles: Record<EnquiryStatus, string> = {
  new: "bg-green text-white",
  contacted: "bg-cream text-ink",
  converted: "bg-[#dcefe3] text-green",
  closed: "bg-line/60 text-muted",
};

/** "+919876543210" -> "+91 98765 43210" */
export function formatMobile(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}

/** "₹27,999" for a rupee amount. */
export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
