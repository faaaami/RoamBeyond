import { getMe } from "@/lib/admin/api";
import { SidebarLinks } from "./SidebarLinks";

/** Loads the sections the signed-in user may open. Render inside <Suspense>. */
export async function SidebarNav() {
  const me = await getMe();
  return (
    <SidebarLinks
      sections={me.sections.map(({ key, title, group, icon }) => ({ key, title, group, icon }))}
    />
  );
}

export function SidebarSkeleton() {
  return (
    <div className="flex animate-shimmer flex-col gap-2 pt-2" aria-hidden="true">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="h-11 rounded-lg bg-white/5" />
      ))}
    </div>
  );
}
