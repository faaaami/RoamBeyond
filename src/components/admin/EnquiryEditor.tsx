"use client";

import { Check, LoaderCircle, Save } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { updateEnquiryAction, type UpdateEnquiryState } from "@/lib/admin/actions";
import type { EnquiryDetail, Option } from "@/lib/admin/api";
import { buttonClass } from "@/components/ui/button";
import { Field, FormError, fieldAria, inputClass } from "@/components/ui/Field";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
];

/** Follow-up shortcuts: today + N days, in India time. */
function plusDays(days: number): string {
  const date = new Date(Date.now() + days * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
}

export function EnquiryEditor({ enquiry, staff, meId }: { enquiry: EnquiryDetail; staff: Option[]; meId: number }) {
  const action = updateEnquiryAction.bind(null, enquiry.reference);
  const [state, formAction, pending] = useActionState<UpdateEnquiryState, FormData>(action, {});
  // Every field is controlled: React resets uncontrolled fields to their initial
  // values after a form action, which would undo what the user just saved.
  const [status, setStatus] = useState<string>(enquiry.status);
  const [notes, setNotes] = useState(enquiry.internalNotes);
  const [followUp, setFollowUp] = useState(enquiry.followUpOn ?? "");
  const [assigned, setAssigned] = useState(enquiry.assignedTo ? String(enquiry.assignedTo.id) : "");
  // Edits since the page loaded, and how many of them the last successful save included.
  const [edits, setEdits] = useState(0);
  const [submittedEdits, setSubmittedEdits] = useState(0);
  const savedEdits = state.ok ? submittedEdits : 0;
  const dirty = edits > savedEdits;
  const showSaved = Boolean(state.ok) && !dirty;
  const markEdited = () => setEdits((n) => n + 1);

  // Warn before leaving with unsaved notes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const err = state.fields ?? {};

  return (
    <form
      action={formAction}
      onChange={markEdited}
      onSubmit={() => setSubmittedEdits(edits)}
      className="flex flex-col gap-5"
    >
      <Field id="ed-status" label="Status" error={err.status} hint="A new lead is contacted first. Converted and Closed are available once it has been contacted.">
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={inputClass} {...fieldAria("ed-status", err.status)}>
          {STATUSES.map((s) => {
            const allowed = enquiry.allowedStatuses.some((a) => a.value === s.value);
            return (
              <option key={s.value} value={s.value} disabled={!allowed}>
                {allowed ? s.label : `${s.label} (not available)`}
              </option>
            );
          })}
        </select>
      </Field>

      <Field id="ed-assigned" label="Assigned to" error={err.assignedTo}>
        <div className="flex gap-2">
          <select
            name="assignedTo"
            value={assigned}
            onChange={(e) => setAssigned(e.target.value)}
            className={inputClass}
            {...fieldAria("ed-assigned", err.assignedTo)}
          >
            <option value="">Nobody</option>
            {staff.map((u) => (
              <option key={u.value} value={u.value}>
                {u.value === String(meId) ? `${u.label} (you)` : u.label}
              </option>
            ))}
          </select>
          {assigned !== String(meId) && (
            <button
              type="button"
              onClick={() => {
                setAssigned(String(meId));
                markEdited();
              }}
              className={buttonClass("outline", "md", "shrink-0 px-4")}
            >
              Me
            </button>
          )}
        </div>
      </Field>

      <Field id="ed-follow-up" label="Follow up on" optional error={err.followUpOn}>
        <input
          type="date"
          name="followUpOn"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          className={inputClass}
          {...fieldAria("ed-follow-up", err.followUpOn)}
        />
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Today", days: 0 },
            { label: "Tomorrow", days: 1 },
            { label: "In 3 days", days: 3 },
            { label: "Next week", days: 7 },
          ].map(({ label, days }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setFollowUp(plusDays(days));
                markEdited();
              }}
              className="inline-flex min-h-9 items-center rounded-full border border-line bg-white px-3 text-xs font-semibold transition-colors hover:border-green hover:text-green"
            >
              {label}
            </button>
          ))}
          {followUp && (
            <button
              type="button"
              onClick={() => {
                setFollowUp("");
                markEdited();
              }}
              className="inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold text-muted hover:text-danger"
            >
              Clear
            </button>
          )}
        </div>
      </Field>

      <Field id="ed-notes" label="Notes for the team" optional error={err.internalNotes} hint="Not visible to the traveller.">
        <textarea
          name="internalNotes"
          rows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={5000}
          placeholder="What did they ask for? When to call back? Quoted price?"
          className={`${inputClass} py-3`}
          {...fieldAria("ed-notes", err.internalNotes)}
        />
      </Field>

      <FormError message={state.error ?? null} />

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass("primary", "md", "flex-1")}>
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {pending ? "Saving…" : "Save changes"}
        </button>
        <span aria-live="polite" className="min-w-20 text-sm font-semibold text-green">
          {showSaved && (
            <span className="inline-flex items-center gap-1">
              <Check className="h-4 w-4" aria-hidden="true" />
              Saved
            </span>
          )}
          {!showSaved && dirty && !pending && <span className="font-normal text-muted">Unsaved</span>}
        </span>
      </div>
    </form>
  );
}
