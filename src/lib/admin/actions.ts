"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { postJson, type ApiErrorBody, type StaffUser } from "./api";
import { FLASH_COOKIE } from "./flash";
import { adminApiUrl } from "./server-api";
import { clearSession, readSession, safeNext, usableAccessToken, writeSession } from "./session";

/* ---------- Flash messages ---------- */

/**
 * The page to go to after a save. The `saved` marker changes the URL even when
 * the page stays the same, so the toast shows after editing in place too.
 */
function afterSave(path: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}saved=1`;
}

/** A one-off success message shown as a toast on the next page (see Toaster). */
async function flash(message: string) {
  (await cookies()).set(FLASH_COOKIE, encodeURIComponent(message), {
    path: "/admin",
    maxAge: 30,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

/* ---------- Sign in and out ---------- */

export interface LoginState {
  error?: string;
  code?: string;
  fields?: { username?: string; password?: string };
  username?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  const next = safeNext(String(formData.get("next") ?? ""));

  const fields: LoginState["fields"] = {};
  if (!username) fields.username = "Enter your username or email.";
  if (!password) fields.password = "Enter your password.";
  if (fields.username || fields.password) return { fields, username };

  const result = await postJson<{ access: string; refresh: string; user: StaffUser }>("auth/login/", {
    username,
    password,
  });
  if (!result.ok) {
    return { error: loginMessage(result.error, result.status), code: result.error.code, username };
  }
  await writeSession(result.data, remember);
  redirect(next);
}

function loginMessage(error: ApiErrorBody, status: number): string {
  if (error.code === "throttled") {
    const minutes = error.retryAfter ? Math.ceil(error.retryAfter / 60) : null;
    return minutes
      ? `Too many sign-in attempts from this network. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`
      : "Too many sign-in attempts from this network. Please wait a few minutes.";
  }
  if (status >= 500 || error.code === "unreachable") {
    return "We could not reach the server. Please try again in a moment.";
  }
  return error.error ?? "Sign-in failed. Please try again.";
}

export async function logoutAction(): Promise<void> {
  const { refresh } = await readSession();
  if (refresh) await postJson("auth/logout/", { refresh }); // blacklists it; best effort
  await clearSession();
  redirect("/admin/login?reason=signed-out");
}

/* ---------- Authenticated calls from actions ---------- */

/**
 * A usable access token for a Server Action, refreshing it in place when it
 * has expired (actions may set cookies, unlike pages). Signs out on failure.
 */
async function actionToken(returnTo: string): Promise<string> {
  const session = await readSession();
  const current = usableAccessToken(session.access);
  if (current) return current;
  if (session.refresh) {
    const refreshed = await postJson<{ access: string; refresh: string }>("auth/refresh/", {
      refresh: session.refresh,
    });
    if (refreshed.ok) {
      await writeSession(refreshed.data, session.remember);
      return refreshed.data.access;
    }
  }
  await clearSession();
  redirect(`/admin/login?reason=expired&next=${encodeURIComponent(returnTo)}`);
}

async function callApi(
  path: string,
  init: { method: string; body?: BodyInit; json?: unknown },
  returnTo: string,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: ApiErrorBody }> {
  const token = await actionToken(returnTo);
  let res: Response;
  try {
    res = await fetch(adminApiUrl(path), {
      method: init.method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.json !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: { error: "We could not reach the server. Your changes were not saved.", code: "unreachable" } };
  }
  if (res.status === 204) return { ok: true, data: {} };
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & ApiErrorBody;
  return res.ok ? { ok: true, data: json } : { ok: false, error: json };
}

/* ---------- Generic create / edit ---------- */

export interface FormState {
  error?: string;
  /** Field errors keyed by the API's dotted path, e.g. "itinerary.1.title". */
  fields?: Record<string, string>;
  /** Changes on every attempt, so the form can react to repeated errors. */
  at?: number;
}

export interface SubmitConfig {
  /** API path, e.g. "packages/" (create) or "packages/12/" (edit). */
  path: string;
  method: "POST" | "PATCH";
  /** Page to show after saving. "{id}" is replaced with the saved record's id. */
  redirectTo: string;
  message: string;
}

/**
 * Sends a form to the API as multipart: the JSON body in `data`, files under
 * their dotted paths (backend: apps/admin_api/base.py JSONWithFilesParser).
 * Bind the config: submitRecord.bind(null, config).
 */
export async function submitRecord(config: SubmitConfig, _prev: FormState, formData: FormData): Promise<FormState> {
  const body = new FormData();
  body.set("data", String(formData.get("data") ?? "{}"));
  for (const [name, value] of formData.entries()) {
    // Empty file inputs arrive as zero-byte files: leave them out so the image is kept.
    if (name !== "data" && value instanceof File && value.size > 0) body.set(name, value);
  }

  const result = await callApi(config.path, { method: config.method, body }, config.redirectTo.replace("{id}", ""));
  if (!result.ok) {
    return {
      error: result.error.error ?? "Your changes were not saved. Please try again.",
      fields: Object.fromEntries((result.error.fields ?? []).map((f) => [f.path, f.message])),
      at: Date.now(),
    };
  }
  revalidatePath("/admin", "layout");
  await flash(config.message);
  redirect(afterSave(config.redirectTo.replace("{id}", String(result.data.id ?? result.data.reference ?? ""))));
}

/* ---------- Delete ---------- */

export interface DeleteState {
  error?: string;
}

// Server Action signatures: useActionState passes (previousState, formData) even when unused.
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function deleteRecord(
  config: { path: string; redirectTo: string; message: string },
  _prev: DeleteState,
  _formData: FormData,
): Promise<DeleteState> {
  const result = await callApi(config.path, { method: "DELETE" }, config.redirectTo);
  if (!result.ok) return { error: result.error.error ?? "It could not be deleted. Please try again." };
  revalidatePath("/admin", "layout");
  await flash(config.message);
  redirect(afterSave(config.redirectTo));
}

/* ---------- One-off actions ---------- */

export async function quickAction(
  config: { path: string; json?: unknown; method?: string; redirectTo?: string; message: string; returnTo: string },
  _prev: DeleteState,
  _formData: FormData,
): Promise<DeleteState> {
  const result = await callApi(config.path, { method: config.method ?? "POST", json: config.json ?? {} }, config.returnTo);
  if (!result.ok) return { error: result.error.error ?? "That did not work. Please try again." };
  revalidatePath("/admin", "layout");
  await flash(config.message);
  redirect(afterSave((config.redirectTo ?? config.returnTo).replace("{id}", String(result.data.id ?? ""))));
}

/* eslint-enable @typescript-eslint/no-unused-vars */

/* ---------- Enquiry follow-up (inline editor) ---------- */

export interface UpdateEnquiryState {
  ok?: boolean;
  error?: string;
  fields?: Record<string, string>;
  savedAt?: number;
}

export async function updateEnquiryAction(
  reference: string,
  _prev: UpdateEnquiryState,
  formData: FormData,
): Promise<UpdateEnquiryState> {
  const assigned = String(formData.get("assignedTo") ?? "");
  const followUp = String(formData.get("followUpOn") ?? "");
  const result = await callApi(
    `enquiries/${encodeURIComponent(reference)}/`,
    {
      method: "PATCH",
      json: {
        status: String(formData.get("status") ?? ""),
        assignedTo: assigned ? Number(assigned) : null,
        followUpOn: followUp || null,
        internalNotes: String(formData.get("internalNotes") ?? ""),
      },
    },
    `/admin/enquiries/${reference}`,
  );
  if (!result.ok) {
    return {
      error: result.error.error ?? "Your changes were not saved. Please try again.",
      fields: Object.fromEntries((result.error.fields ?? []).map((f) => [f.path, f.message])),
    };
  }
  revalidatePath("/admin", "layout");
  return { ok: true, savedAt: Date.now() };
}

/* ---------- My account ---------- */

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await callApi(
    "auth/password/",
    {
      method: "POST",
      json: {
        currentPassword: String(formData.get("currentPassword") ?? ""),
        newPassword: String(formData.get("newPassword") ?? ""),
      },
    },
    "/admin/account",
  );
  if (!result.ok) {
    return {
      error: result.error.error ?? "Your password was not changed.",
      fields: Object.fromEntries((result.error.fields ?? []).map((f) => [f.path, f.message])),
      at: Date.now(),
    };
  }
  await flash("Your password has been changed.");
  redirect(afterSave("/admin/account"));
}

/* ---------- Enquiry delete ---------- */

/** Removes an enquiry. Administrators and anyone with the delete permission only (the API decides). */
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function deleteEnquiryAction(reference: string, _prev: DeleteState, _formData: FormData): Promise<DeleteState> {
  const result = await callApi(`enquiries/${encodeURIComponent(reference)}/`, { method: "DELETE" }, `/admin/enquiries/${reference}`);
  if (!result.ok) return { error: result.error.error ?? "The enquiry could not be deleted. Please try again." };
  revalidatePath("/admin", "layout");
  await flash("Enquiry deleted.");
  redirect(afterSave("/admin/enquiries"));
}
/* eslint-enable @typescript-eslint/no-unused-vars */
