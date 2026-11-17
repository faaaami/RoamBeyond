"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole, TriangleAlert } from "lucide-react";
import { useActionState, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { loginAction, type LoginState } from "@/lib/admin/actions";
import { buttonClass } from "@/components/ui/button";
import { Field, fieldAria, inputClass } from "@/components/ui/Field";

/**
 * Staff sign-in. Works without JavaScript (plain form post to a Server
 * Action); with it, adds pending state, password reveal and a Caps Lock hint.
 */
export function LoginForm({ next, notice }: { next: string; notice?: { tone: "info" | "warn"; text: string } }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // After a failed attempt, put the cursor where the visitor needs to act.
  useEffect(() => {
    if (state.fields?.username) usernameRef.current?.focus();
    else if (state.fields?.password || state.code === "invalid_credentials") {
      passwordRef.current?.select();
    }
  }, [state]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.("CapsLock") ?? false);

  return (
    <form action={action} noValidate className="flex flex-col gap-5" aria-describedby="login-status">
      <input type="hidden" name="next" value={next} />

      <div id="login-status" aria-live="polite" className="empty:hidden">
        {state.error ? (
          <p
            role="alert"
            className="flex gap-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {state.error}
          </p>
        ) : notice ? (
          <p
            className={
              notice.tone === "warn"
                ? "rounded-lg border border-cream-dark bg-cream px-4 py-3 text-sm font-medium text-ink"
                : "rounded-lg border border-line bg-white px-4 py-3 text-sm text-muted"
            }
          >
            {notice.text}
          </p>
        ) : null}
      </div>

      <Field id="login-username" label="Username or email" error={state.fields?.username}>
        <input
          ref={usernameRef}
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          required
          defaultValue={state.username}
          disabled={pending}
          className={inputClass}
          {...fieldAria("login-username", state.fields?.username)}
        />
      </Field>

      <Field
        id="login-password"
        label="Password"
        error={state.fields?.password}
        hint={capsLock ? "Caps Lock is on." : undefined}
      >
        <div className="relative">
          <input
            ref={passwordRef}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={pending}
            onKeyDown={onKey}
            onKeyUp={onKey}
            className={`${inputClass} pr-14`}
            {...fieldAria("login-password", state.fields?.password)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-lg text-muted transition-colors hover:text-green focus-visible:outline-2 focus-visible:outline-green"
          >
            {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </Field>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          name="remember"
          disabled={pending}
          className="h-5 w-5 rounded border-line accent-green"
        />
        Keep me signed in on this device
      </label>

      <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "w-full")}>
        {pending ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          <>
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            Sign in
          </>
        )}
      </button>

      <p className="text-center text-sm text-muted">
        Forgot your password? Ask an administrator to reset it in the admin.
      </p>
    </form>
  );
}
