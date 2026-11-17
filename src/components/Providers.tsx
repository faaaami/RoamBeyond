"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** `reducedMotion="user"` makes Framer Motion skip transform animations when the OS asks for it. */
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
