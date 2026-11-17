"use client";

import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Plus, Save, Trash2, TriangleAlert, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FormState } from "@/lib/admin/actions";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { Field, fieldAria, inputClass } from "@/components/ui/Field";

/*
 * Form toolkit for admin records.
 *
 * <RecordForm> keeps every value in state and, on submit, sends one hidden
 * `data` field with the JSON body plus a file input per new image, named by
 * its dotted path ("cover", "photos.0.image"). Server Actions forward that to
 * the API unchanged (lib/actions.ts submitRecord). Fields bind by `name`, a
 * dotted path into the values, and show the API's error for that path.
 */

type Values = Record<string, unknown>;

interface FormCtx {
  get: (path: string) => unknown;
  set: (path: string, value: unknown) => void;
  error: (path: string) => string | undefined;
  errorsUnder: (prefixes: string[]) => boolean;
  disabled: boolean;
}

const Ctx = createContext<FormCtx | null>(null);

function useForm(): FormCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Form fields must be inside <RecordForm>");
  return ctx;
}

const split = (path: string) => path.split(".").map((p) => (/^\d+$/.test(p) ? Number(p) : p));

function getIn(obj: unknown, path: string): unknown {
  return split(path).reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string | number, unknown>)[key]), obj);
}

function setIn<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = split(path);
  const base: Record<string | number, unknown> = Array.isArray(obj) ? [...(obj as unknown[])] as never : { ...(obj as object) };
  base[head] = rest.length ? setIn(base[head] ?? (typeof rest[0] === "number" ? [] : {}), rest.join("."), value) : value;
  return base as T;
}

/** Keys holding images: left out of the JSON unless cleared (null), since files travel separately. */
const IMAGE_KEYS = new Set(["image", "cover", "teamPhoto", "officePhoto"]);

function serialize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "_key") continue;
      // An empty password box means "keep the current password": send nothing.
      if (k === "password" && v === "") continue;
      if (IMAGE_KEYS.has(k) && v !== null) continue;
      out[k] = serialize(v);
    }
    return out;
  }
  return value;
}

/* ---------------------------------------------------------------------------
 * The form
 * ------------------------------------------------------------------------- */

export function RecordForm({
  action,
  initial,
  children,
  submitLabel = "Save changes",
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  /** The record's current values (any object: API responses are typed interfaces). */
  initial: object;
  children: ReactNode;
  submitLabel?: string;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [values, setValues] = useState<Values>(initial as Values);
  const [dirty, setDirty] = useState(false);
  const errors = useMemo(() => state.fields ?? {}, [state]);
  const topRef = useRef<HTMLDivElement>(null);

  // Warn before leaving with unsaved changes (not while the form is being sent).
  useEffect(() => {
    if (!dirty || pending) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, pending]);

  // After a failed save, bring the error summary into view.
  useEffect(() => {
    if (state.error) topRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state.error, state.at]);

  const ctx: FormCtx = {
    get: (path) => getIn(values, path),
    set: (path, value) => {
      setValues((v) => setIn(v, path, value));
      setDirty(true);
    },
    error: (path) => errors[path] ?? (path.includes(".") ? undefined : errors[`${path}.0`]),
    errorsUnder: (prefixes) =>
      Object.keys(errors).some((k) => prefixes.some((p) => k === p || k.startsWith(`${p}.`))),
    disabled: pending,
  };

  const fieldErrorCount = Object.keys(errors).length;

  return (
    <Ctx.Provider value={ctx}>
      <form action={formAction} noValidate className="flex flex-col gap-6" aria-busy={pending}>
        <input type="hidden" name="data" value={JSON.stringify(serialize(values))} />
        <div ref={topRef} aria-live="assertive">
          {state.error && (
            <div role="alert" className="flex gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-danger">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">{state.error}</p>
                {fieldErrorCount > 0 && (
                  <p className="mt-0.5 text-sm">
                    {fieldErrorCount === 1 ? "One field needs" : `${fieldErrorCount} fields need`} attention. They are
                    marked in red below.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {children}

        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
          {dirty && !pending && <span className="mr-auto text-sm text-muted">Unsaved changes</span>}
          {cancelHref && (
            <Link href={cancelHref} className={buttonClass("ghost", "md")}>
              Cancel
            </Link>
          )}
          <button type="submit" disabled={pending} className={buttonClass("primary", "md", "min-w-36")}>
            {pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </Ctx.Provider>
  );
}

/* ---------------------------------------------------------------------------
 * Layout helpers
 * ------------------------------------------------------------------------- */

/** A white card grouping related fields. */
export function FormSection({ title, description, children, columns = 1 }: { title?: string; description?: ReactNode; children: ReactNode; columns?: 1 | 2 }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 md:p-6">
      {title && <h2 className="text-xl font-bold">{title}</h2>}
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className={cn("grid gap-5", Boolean(title || description) && "mt-5", columns === 2 && "md:grid-cols-2")}>{children}</div>
    </section>
  );
}

/**
 * Tabs for long forms. Every tab stays mounted (so chosen files are kept); a
 * dot marks tabs with errors and the first such tab opens after a failed save.
 */
export function FormTabs({ tabs }: { tabs: { id: string; label: string; fields: string[]; content: ReactNode }[] }) {
  const { errorsUnder } = useForm();
  const [active, setActive] = useState(tabs[0].id);
  const firstWithError = tabs.find((t) => errorsUnder(t.fields))?.id;
  const [shownError, setShownError] = useState<string | undefined>();
  if (firstWithError !== shownError) {
    setShownError(firstWithError);
    if (firstWithError) setActive(firstWithError);
  }

  return (
    <div>
      <div role="tablist" aria-label="Form sections" className="-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1">
        {tabs.map((tab) => {
          const hasError = errorsUnder(tab.fields);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={active === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={cn(
                "relative -mb-px inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors",
                active === tab.id ? "border-green text-green" : "border-transparent text-muted hover:text-ink",
              )}
            >
              {tab.label}
              {hasError && <span className="h-2 w-2 rounded-full bg-danger" aria-label="has errors" />}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
          className="flex flex-col gap-6 pt-6"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Fields
 * ------------------------------------------------------------------------- */

const idFor = (name: string) => `f-${name.replace(/\./g, "-")}`;

interface BaseProps {
  name: string;
  label: string;
  hint?: string;
  optional?: boolean;
  className?: string;
}

export function TextField({
  name,
  label,
  hint,
  optional,
  className,
  type = "text",
  placeholder,
  prefix,
  onValueChange,
}: BaseProps & { type?: "text" | "email" | "url" | "tel" | "password" | "date"; placeholder?: string; prefix?: string; onValueChange?: (v: string) => void }) {
  const f = useForm();
  const id = idFor(name);
  const error = f.error(name);
  const input = (
    <input
      type={type}
      value={String(f.get(name) ?? "")}
      onChange={(e) => {
        f.set(name, e.target.value);
        onValueChange?.(e.target.value);
      }}
      placeholder={placeholder}
      disabled={f.disabled}
      autoComplete={type === "password" ? "new-password" : "off"}
      className={cn(inputClass, prefix && "pl-9")}
      {...fieldAria(id, error)}
    />
  );
  return (
    <Field id={id} label={label} hint={hint} optional={optional} error={error} className={className}>
      {prefix ? (
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted">{prefix}</span>
          {input}
        </div>
      ) : (
        input
      )}
    </Field>
  );
}

export function NumberField({ name, label, hint, optional, className, min, nullable }: BaseProps & { min?: number; nullable?: boolean }) {
  const f = useForm();
  const id = idFor(name);
  const error = f.error(name);
  const value = f.get(name);
  return (
    <Field id={id} label={label} hint={hint} optional={optional} error={error} className={className}>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        value={value === null || value === undefined ? "" : String(value)}
        onChange={(e) => f.set(name, e.target.value === "" ? (nullable ? null : "") : Number(e.target.value))}
        disabled={f.disabled}
        className={inputClass}
        {...fieldAria(id, error)}
      />
    </Field>
  );
}

export function TextAreaField({ name, label, hint, optional, className, rows = 4 }: BaseProps & { rows?: number }) {
  const f = useForm();
  const id = idFor(name);
  const error = f.error(name);
  return (
    <Field id={id} label={label} hint={hint} optional={optional} error={error} className={className}>
      <textarea
        rows={rows}
        value={String(f.get(name) ?? "")}
        onChange={(e) => f.set(name, e.target.value)}
        disabled={f.disabled}
        className={cn(inputClass, "py-3 leading-relaxed")}
        {...fieldAria(id, error)}
      />
    </Field>
  );
}

/** A list of strings, edited one per line (highlights, inclusions, cancellation terms...). */
export function LinesField({ name, label, hint, optional, className, rows = 5 }: BaseProps & { rows?: number }) {
  const f = useForm();
  const id = idFor(name);
  const error = f.error(name);
  const list = (f.get(name) as string[] | undefined) ?? [];
  const [text, setText] = useState(list.join("\n"));
  return (
    <Field id={id} label={label} hint={hint ?? "One per line."} optional={optional} error={error} className={className}>
      <textarea
        rows={rows}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          f.set(
            name,
            e.target.value
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean),
          );
        }}
        disabled={f.disabled}
        className={cn(inputClass, "py-3 leading-relaxed")}
        {...fieldAria(id, error)}
      />
    </Field>
  );
}

export function SelectField({
  name,
  label,
  hint,
  optional,
  className,
  options,
  placeholder,
  numeric,
}: BaseProps & { options: { value: string; label: string }[]; placeholder?: string; numeric?: boolean }) {
  const f = useForm();
  const id = idFor(name);
  const error = f.error(name);
  const value = f.get(name);
  return (
    <Field id={id} label={label} hint={hint} optional={optional} error={error} className={className}>
      <select
        value={value === null || value === undefined ? "" : String(value)}
        onChange={(e) => f.set(name, e.target.value === "" ? null : numeric ? Number(e.target.value) : e.target.value)}
        disabled={f.disabled}
        className={inputClass}
        {...fieldAria(id, error)}
      >
        <option value="">{placeholder ?? "Choose…"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** An on/off switch with an explanation, for flags such as "Published". */
export function SwitchField({ name, label, hint }: { name: string; label: string; hint?: string }) {
  const f = useForm();
  const id = idFor(name);
  const on = Boolean(f.get(name));
  const error = f.error(name);
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-line bg-paper/60 p-4">
      <div>
        <label htmlFor={id} className="font-semibold text-ink">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
        {error && <p className="mt-1 text-sm font-medium text-danger">{error}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        disabled={f.disabled}
        onClick={() => f.set(name, !on)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
          on ? "bg-green" : "bg-line",
        )}
      >
        <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow transition-transform", on ? "translate-x-6" : "translate-x-1")} />
      </button>
    </div>
  );
}

/** Tick-boxes for a list value (e.g. trip types). */
export function CheckboxGroupField({ name, label, hint, options, className }: BaseProps & { options: { value: string; label: string }[] }) {
  const f = useForm();
  const id = idFor(name);
  const error = f.error(name);
  const selected = new Set((f.get(name) as string[] | undefined) ?? []);
  return (
    <fieldset className={cn("flex flex-col gap-1.5", className)} aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="text-sm font-semibold text-ink">{label}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = selected.has(o.value);
          return (
            <label
              key={o.value}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                checked ? "border-green bg-green text-white" : "border-line bg-white hover:border-green",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                disabled={f.disabled}
                onChange={() => {
                  const next = new Set(selected);
                  if (checked) next.delete(o.value);
                  else next.add(o.value);
                  f.set(name, options.map((x) => x.value).filter((v) => next.has(v)));
                }}
              />
              {o.label}
            </label>
          );
        })}
      </div>
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/**
 * An image: shows the current one, picks a new file (sent as `name`), and can
 * remove it when `removable`. Doing nothing keeps the current image.
 */
export function ImageField({ name, label, hint, optional, removable, aspect = "aspect-[4/3]" }: BaseProps & { removable?: boolean; aspect?: string }) {
  const f = useForm();
  const id = idFor(name);
  const error = f.error(name);
  const current = f.get(name) as string | null | undefined;
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = preview ?? (current || null);
  return (
    <Field id={id} label={label} hint={hint ?? "JPEG, PNG or WebP, up to 10 MB. Landscape photos work best."} optional={optional} error={error}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className={cn("relative w-full overflow-hidden rounded-lg border border-line bg-mist sm:w-56", aspect)}>
          {shown ? (
            // Local previews are blob: URLs, which next/image cannot optimise.
            preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <Image src={shown} alt="" fill sizes="224px" className="object-cover" />
            )
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted">
              <ImagePlus className="h-8 w-8" aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={buttonClass("outline", "md", "cursor-pointer")}>
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {shown ? "Replace photo" : "Choose photo"}
            <input
              ref={fileRef}
              type="file"
              name={name}
              accept="image/jpeg,image/png,image/webp"
              disabled={f.disabled}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (preview) URL.revokeObjectURL(preview);
                setPreview(file ? URL.createObjectURL(file) : null);
                // A new file replaces the image; a previous "remove" (null) no longer applies.
                if (file) f.set(name, current ?? "");
              }}
              {...fieldAria(id, error)}
            />
          </label>
          {preview && (
            <button
              type="button"
              onClick={() => {
                if (fileRef.current) fileRef.current.value = "";
                setPreview(null);
              }}
              className={buttonClass("ghost", "md")}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Undo
            </button>
          )}
          {removable && !preview && current && (
            <button type="button" onClick={() => f.set(name, null)} className={buttonClass("ghost", "md", "text-danger hover:bg-danger/5")}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </button>
          )}
        </div>
      </div>
    </Field>
  );
}

/* ---------------------------------------------------------------------------
 * Repeater: an ordered list of rows (itinerary days, photos, sections...)
 * ------------------------------------------------------------------------- */

let nextKey = 0;
const newKey = () => `new-${++nextKey}`;

export function Repeater({
  name,
  label,
  description,
  addLabel,
  newItem,
  itemTitle,
  empty,
  children,
}: {
  name: string;
  label: string;
  description?: ReactNode;
  addLabel: string;
  newItem: () => Record<string, unknown>;
  itemTitle: (item: Record<string, unknown>, index: number) => string;
  empty: string;
  children: (path: (field: string) => string, item: Record<string, unknown>, index: number) => ReactNode;
}) {
  const f = useForm();
  // Saved rows are keyed by id; rows added here carry a client-only `_key` (never sent).
  const items = ((f.get(name) as Record<string, unknown>[] | undefined) ?? []).map((item, i) =>
    item._key || item.id ? item : { ...item, _key: `row-${i}` },
  );
  const listError = f.error(name);
  const update = (next: Record<string, unknown>[]) => f.set(name, next);
  const move = (from: number, to: number) => {
    const next = [...items];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    update(next);
  };

  return (
    <section className="rounded-xl border border-line bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{label}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        <button type="button" disabled={f.disabled} onClick={() => update([...items, { ...newItem(), _key: newKey() }])} className={buttonClass("outline", "md")}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {addLabel}
        </button>
      </div>
      {listError && <p role="alert" className="mt-3 text-sm font-medium text-danger">{listError}</p>}

      {items.length === 0 ? (
        <p className="mt-5 rounded-lg border border-dashed border-line px-4 py-8 text-center text-muted">{empty}</p>
      ) : (
        <ol className="mt-5 flex flex-col gap-4">
          {items.map((item, index) => {
            const path = (field: string) => `${name}.${index}.${field}`;
            const rowHasError = f.errorsUnder([`${name}.${index}`]);
            return (
              <li
                key={String(item.id ?? item._key)}
                className={cn("rounded-lg border bg-paper/50 p-4", rowHasError ? "border-danger/50" : "border-line")}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-green px-2 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{itemTitle(item, index)}</span>
                  <button type="button" aria-label="Move up" disabled={index === 0 || f.disabled} onClick={() => move(index, index - 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-mist hover:text-ink disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" aria-label="Move down" disabled={index === items.length - 1 || f.disabled} onClick={() => move(index, index + 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-mist hover:text-ink disabled:opacity-30">
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" aria-label="Remove" disabled={f.disabled} onClick={() => update(items.filter((_, i) => i !== index))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">{children(path, item, index)}</div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
