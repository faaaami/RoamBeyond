"use client";

import { Copy, LoaderCircle, Mail, Trash2, TriangleAlert, type LucideIcon } from "lucide-react";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import type { DeleteState } from "@/lib/admin/actions";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";

/**
 * A button that asks before doing something (deleting, duplicating, sending an
 * email). The action runs only after the confirm button in the dialog.
 */
export function ConfirmButton({
  action,
  label,
  title,
  body,
  confirmLabel,
  icon = "trash",
  danger = true,
  variant = "ghost",
}: {
  action: (state: DeleteState, formData: FormData) => Promise<DeleteState>;
  label: string;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  /**
   * A name, not a component: functions cannot cross from a Server Component
   * into this Client Component.
   */
  icon?: "trash" | "copy" | "mail";
  danger?: boolean;
  variant?: "ghost" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const Icon: LucideIcon = icon === "copy" ? Copy : icon === "mail" ? Mail : Trash2;
  const [state, formAction, pending] = useActionState<DeleteState, FormData>(action, {});
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass(variant, "md", danger ? "text-danger hover:bg-danger/5 hover:text-danger" : "")}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        aria-labelledby="confirm-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-line bg-white p-0 text-ink shadow-lift backdrop:bg-ink/50"
      >
        <form action={formAction} className="p-6">
          <span
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-full",
              danger ? "bg-danger/10 text-danger" : "bg-mist text-green",
            )}
          >
            {danger ? <TriangleAlert className="h-5 w-5" aria-hidden="true" /> : <Icon className="h-5 w-5" aria-hidden="true" />}
          </span>
          <h2 id="confirm-title" className="mt-4 text-2xl font-bold">
            {title}
          </h2>
          <div className="mt-2 text-muted">{body}</div>
          {state.error && (
            <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
              {state.error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost", "md")} autoFocus>
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className={buttonClass(danger ? "dark" : "primary", "md", danger ? "bg-danger hover:bg-danger/90" : "")}
            >
              {pending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {confirmLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
