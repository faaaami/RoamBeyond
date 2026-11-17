import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared classes for text inputs, selects and textareas. 48px tall, 16px text (no iOS zoom). */
export const inputClass =
  "block w-full min-h-12 rounded-lg border border-line bg-white px-4 text-base text-ink " +
  "placeholder:text-muted/70 transition-colors " +
  "hover:border-green/50 focus:border-green focus:outline-none focus:ring-2 focus:ring-green/25 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger/15";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Label, control and inline error. Pass the same `id` to the control, and
 * set `aria-describedby={`${id}-error`}` on it when there is an error.
 */
export function Field({ id, label, error, hint, optional, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Spread onto a control to wire up its error state for assistive tech. */
export function fieldAria(id: string, error?: string) {
  return {
    id,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
}

/** Visually hidden trap for bots. Real visitors never reach it. */
export function Honeypot({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      {children}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
    >
      {message}
    </p>
  );
}
