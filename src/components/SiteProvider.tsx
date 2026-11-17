"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteSettings } from "@/data/types";
import type { NavLink, TripTypeInfo, Vocabulary } from "@/lib/content";

export interface SiteData {
  settings: SiteSettings;
  /** Every destination, for dropdowns in client components. */
  destinations: { slug: string; name: string }[];
  navLinks: NavLink[];
  tripTypes: TripTypeInfo[];
  vocabulary: Vocabulary;
}

const SiteContext = createContext<SiteData | null>(null);

/**
 * Makes the admin-managed site settings available to client components.
 * The root layout fetches the data on the server and passes it in.
 * Server components should call getSiteSettings() directly instead.
 */
export function SiteProvider({ value, children }: { value: SiteData; children: ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteData {
  const value = useContext(SiteContext);
  if (!value) throw new Error("useSite must be used inside <SiteProvider>");
  return value;
}
