"use client";

import { useEffect } from "react";
import { captureLanding } from "@/lib/attribution";

/** Records campaign tags from the landing page (see src/lib/attribution.ts). Renders nothing. */
export function AttributionTracker() {
  useEffect(() => captureLanding(), []);
  return null;
}
