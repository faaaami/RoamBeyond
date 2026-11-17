import type { EnquiryStatus } from "@/lib/admin/api";
import { cn } from "@/lib/utils";
import { statusStyles } from "./format";

export function StatusPill({ status, label, className }: { status: EnquiryStatus; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide",
        statusStyles[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
