import Link from "next/link";
import type { UseFormRegisterReturn } from "react-hook-form";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Required consent checkbox shared by all three forms. The whole row is a 44px tap target. */
export function ConsentField({
  id,
  registration,
  error,
  light = false,
}: {
  id: string;
  registration: UseFormRegisterReturn;
  error?: string;
  light?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          "flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-snug",
          light ? "text-white/90" : "text-muted",
        )}
      >
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer rounded accent-green"
          {...registration}
        />
        <span>
          I agree that {siteConfig.name} may call or message me about this enquiry. See our{" "}
          <Link
            href="/privacy"
            className={cn("font-semibold underline underline-offset-2", light ? "text-white" : "text-green")}
          >
            privacy policy
          </Link>
          .
        </span>
      </label>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className={cn(
            "mt-1 text-sm font-medium",
            light ? "inline-block rounded-md bg-white px-2 py-0.5 text-danger" : "text-danger",
          )}
        >
          {error}
        </p>
      )}
    </div>
  );
}
