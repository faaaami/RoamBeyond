"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { StoryScene } from "@/lib/content";
import { buttonClass } from "../ui/button";

/**
 * A pinned, scroll-driven photo story. The section is one screen tall per scene;
 * its inner panel sticks to the viewport while scrolling crossfades the photos
 * and swaps the text, like scrubbing through a film.
 *
 * - Driver: useScroll on the section, progress 0 to 1 across its full height.
 * - Each scene: opacity fades in and out at its boundaries, the photo scales
 *   1.18 to 1 (slow push-out) and the text rises 48px as it arrives.
 * - Progress rail on the right fills with scaleY.
 * - Reduced motion: scenes switch without zoom or movement.
 * - Transform and opacity only.
 */
export function ScrollStory({ scenes }: { scenes: StoryScene[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  if (scenes.length === 0) return null;

  return (
    <section
      ref={ref}
      aria-label="A journey across India"
      className="relative mb-3 text-white md:mb-5"
      style={{ height: `${scenes.length * 100}svh` }}
    >
      <div className="sticky top-[4.75rem] mx-3 rounded-xl md:mx-5 h-[calc(100svh-5.5rem)] overflow-hidden bg-ink md:top-[6rem] md:h-[calc(100svh-7rem)]">
        {scenes.map((scene, i) => (
          <Scene
            key={scene.key}
            scene={scene}
            index={i}
            count={scenes.length}
            progress={scrollYProgress}
            reduce={reduce}
          />
        ))}

        {/* Progress rail */}
        <div
          aria-hidden="true"
          className="absolute bottom-10 right-5 top-10 hidden w-1 overflow-hidden rounded-full bg-white/25 md:right-8 md:block"
        >
          <motion.div className="h-full w-full origin-top bg-cream" style={{ scaleY: scrollYProgress }} />
        </div>
      </div>
    </section>
  );
}

function Scene({
  scene,
  index,
  count,
  progress,
  reduce,
}: {
  scene: StoryScene;
  index: number;
  count: number;
  progress: MotionValue<number>;
  reduce: boolean;
}) {
  const start = index / count;
  const end = (index + 1) / count;
  // How much of the scroll is spent crossfading between two scenes.
  const fade = reduce ? 0.001 : 0.07;
  const first = index === 0;
  const last = index === count - 1;

  // Scroll offsets must stay inside 0 to 1 and never decrease, so the first and
  // last scenes get their own shorter ranges instead of running past the ends.
  const fadeIn = Math.max(0, start - fade);
  const opacity = useTransform(
    progress,
    first ? [0, end - fade, end] : last ? [fadeIn, start, 1] : [fadeIn, start, end - fade, end],
    first ? [1, 1, 0] : last ? [0, 1, 1] : [0, 1, 1, 0],
  );
  const scale = useTransform(progress, [fadeIn, end], reduce ? [1, 1] : [1.18, 1]);
  const textY = useTransform(
    progress,
    [fadeIn, Math.min(1, start + 0.04)],
    reduce || first ? [0, 0] : [48, 0],
  );
  // Only the visible scene should be clickable or focusable.
  const pointerEvents = useTransform(opacity, (v) => (v > 0.5 ? "auto" : "none"));
  const visibility = useTransform(opacity, (v) => (v > 0.01 ? "visible" : "hidden"));

  return (
    <motion.div className="absolute inset-0" style={{ opacity, pointerEvents, visibility }}>
      <motion.div className="absolute inset-0 will-change-transform" style={{ scale }}>
        <Image
          src={scene.image}
          alt=""
          fill
          sizes="100vw"
          loading={first ? "eager" : "lazy"}
          className="object-cover"
        />
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink/90 via-ink/40 to-ink/20" />

      <motion.div
        style={{ y: textY }}
        className="container-page absolute inset-x-0 bottom-0 pb-12 md:pb-20"
      >
        <p className="eyebrow flex items-center gap-3 text-cream">
          <span className="font-display text-base tracking-normal">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
          <span aria-hidden="true" className="h-px w-10 bg-cream/70" />
          {scene.label}
        </p>
        <h2 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.04] sm:text-5xl lg:text-7xl">
          {scene.title}
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-white md:text-xl">{scene.text}</p>
        <Link href={`/destinations/${scene.slug}`} className={buttonClass("cream", "lg", "mt-6")}>
          Explore trips
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
