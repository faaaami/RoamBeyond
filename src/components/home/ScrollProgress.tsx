"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Thin bar under the header that fills as the page is read.
 * Driver: page scroll progress, smoothed with a spring. Animates scaleX only.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-16 z-40 h-1 origin-left bg-green md:top-20"
    />
  );
}
