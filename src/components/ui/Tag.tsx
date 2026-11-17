import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  cream: "bg-cream text-ink",
  white: "bg-white text-ink",
  green: "bg-green text-white",
  mist: "bg-mist text-ink",
} as const;

export function Tag({
  children,
  tone = "mist",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-md px-3 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
