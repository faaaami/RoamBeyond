import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardFrame } from "@/components/admin/DashboardFrame";
import { SidebarNav, SidebarSkeleton } from "@/components/admin/SidebarNav";
import { Toaster } from "@/components/admin/Toaster";
import { UserMenu, UserMenuSkeleton } from "@/components/admin/UserMenu";
import { AdminApiError, getMe } from "@/lib/admin/api";

/**
 * The panel is private and always needs live data, so its pages may block on
 * the server (no static shell is wanted here). See Next's "instant" guide.
 */
export const instant = false;

/**
 * Every signed-in page: sidebar, top bar, content and success toasts.
 * The page content streams behind a Suspense boundary: each page fetches its
 * data from the API at request time, and this is what lets it do so.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Only staff get past this point. Anyone else is sent to the public site, and the
  // admin is never shown to them. A missing or expired session is handled by the proxy
  // and by the API calls themselves (they send the visitor to sign in).
  try {
    await getMe("/admin");
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 403) redirect("/");
    throw err;
  }
  return (
    <DashboardFrame
      sidebar={
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarNav />
        </Suspense>
      }
      user={
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
        </Suspense>
      }
    >
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      <Suspense>
        <Toaster />
      </Suspense>
    </DashboardFrame>
  );
}

function PageSkeleton() {
  return (
    <div className="flex animate-shimmer flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="h-16 w-1/2 rounded-xl bg-mist" />
      <div className="h-96 rounded-xl bg-mist" />
    </div>
  );
}
