"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * Reduced motion: the markup stays identical (so hydration is safe) but every
 * transition runs with zero duration, so content simply appears.
 */
const INSTANT = { duration: 0 } as const;

/**
 * Fades and slides its children up the first time they scroll into view.
 * Trigger: 15% visible, once. Duration 0.6s, ease-out. Transform and opacity only.
 */
export function SectionReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={reduce ? INSTANT : { duration: 0.6, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

function itemVariants(effect: "rise" | "scale", reduce: boolean): Variants {
  const hidden = effect === "rise" ? { opacity: 0, y: 28 } : { opacity: 0, scale: 0.94 };
  const shown = effect === "rise" ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1 };
  return {
    hidden,
    show: {
      ...shown,
      transition: reduce ? INSTANT : { duration: effect === "rise" ? 0.55 : 0.6, ease: EASE_OUT },
    },
  };
}

/** Wrap a grid in StaggerGroup and each cell in StaggerItem to stagger children in by 80ms. */
export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : 0.08 } },
      }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  effect = "rise",
}: {
  children: ReactNode;
  className?: string;
  effect?: "rise" | "scale";
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div className={className} variants={itemVariants(effect, Boolean(reduce))}>
      {children}
    </motion.div>
  );
}
