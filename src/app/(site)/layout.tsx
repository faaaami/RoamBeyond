import { AttributionTracker } from "@/components/AttributionTracker";
import { SiteShell } from "@/components/SiteShell";

/** Every public page gets the header, footer and WhatsApp button. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      <AttributionTracker />
      {children}
    </SiteShell>
  );
}
