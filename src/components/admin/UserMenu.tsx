import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/admin/actions";
import { getMe } from "@/lib/admin/api";

/** Name, role and sign-out in the top bar. Reads the session, so render it inside <Suspense>. */
export async function UserMenu() {
  const me = await getMe();
  const initials = me.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2 border-l border-line pl-3 md:pl-4">
      <span
        aria-hidden="true"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green font-display text-sm font-bold text-cream"
      >
        {initials}
      </span>
      <span className="hidden leading-tight sm:block">
        <span className="block max-w-40 truncate text-sm font-semibold text-ink">{me.name}</span>
        <span className="block text-xs text-muted">{me.isSuperuser ? "Administrator" : "Staff"}</span>
      </span>
      <form action={logoutAction}>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted transition-colors hover:bg-mist hover:text-danger"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden md:inline">Sign out</span>
          <span className="sr-only md:hidden">Sign out</span>
        </button>
      </form>
    </div>
  );
}

export function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-2 border-l border-line pl-3 md:pl-4" aria-hidden="true">
      <span className="h-10 w-10 animate-shimmer rounded-full bg-mist" />
      <span className="hidden h-8 w-28 animate-shimmer rounded bg-mist sm:block" />
    </div>
  );
}
