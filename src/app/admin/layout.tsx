import type { Metadata } from "next";

/** The admin panel is private: it is never indexed. Each page sets its own title. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
