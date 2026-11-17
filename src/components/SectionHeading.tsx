import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  lead,
  light = false,
  action,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  light?: boolean;
  action?: ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className={cn("eyebrow", light ? "text-cream" : "text-green")}>{eyebrow}</p>}
        <Heading
          className={cn(
            "mt-2 text-4xl font-extrabold leading-[1.05] md:text-5xl",
            light ? "text-white" : "text-ink",
          )}
        >
          {title}
        </Heading>
        {lead && (
          <p className={cn("mt-3 text-lg leading-relaxed", light ? "text-white/85" : "text-muted")}>
            {lead}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
