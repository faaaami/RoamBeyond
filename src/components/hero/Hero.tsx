"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useState, type PointerEvent, type ReactNode } from "react";
import { siteConfig } from "@/config/site";
import type { HomeContent } from "@/lib/content";
import { EASE_OUT } from "../SectionReveal";
import { useSite } from "../SiteProvider";
import { buttonClass } from "../ui/button";
import { HeroScene } from "./HeroScene";

/** Where the floating destination chips sit (wide screens only). */
const CHIP_SPOTS = ["right-[5%] top-[40%]", "right-[19%] top-[53%]", "right-[7%] top-[66%]"];
const ROTATE_SECONDS = 2.6;
const SPRING = { stiffness: 60, damping: 18, mass: 0.6 };

/**
 * Landing page hero: an illustrated, animated scene with the headline over it.
 * There are no photos; the background is drawn in HeroScene.
 *
 * - Scene: dusk sky, rising sun, flight route and layered mountains (see HeroScene).
 * - Pointer: the scene layers shift with the cursor, and a soft light follows it.
 * - Scroll: the headline lifts 60px and fades across the first 600px of scroll.
 * - Headline: each word slides up from behind a mask, 0.7s ease-out, 70ms apart.
 * - Destinations: three floating chips and a rotating name, read from the backend.
 * - Optional video: set `heroVideo` in src/config/site.ts to play a muted loop instead.
 * - Reduced motion: the finished scene, still, with all text visible at once.
 * - Only transform and opacity are animated.
 *
 * `text` is the wording from the admin (Home page, Top of page).
 * `search` is passed in so the QuickSearch form can stay a server component.
 */
export function Hero({ text, search }: { text: HomeContent["hero"]; search: ReactNode }) {
  // The headline animates word by word; the second line is shown in cream.
  const headline = [text.headlineLine1, text.headlineLine2].map((line) => line.split(/\s+/).filter(Boolean));
  const reduce = useReducedMotion();
  const { destinations } = useSite();
  const [index, setIndex] = useState(0);
  const hasVideo = siteConfig.heroVideo.length > 0;

  // Rotate through the destination names under the headline.
  useEffect(() => {
    if (reduce || destinations.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % destinations.length),
      ROTATE_SECONDS * 1000,
    );
    return () => window.clearInterval(timer);
  }, [reduce, destinations.length]);

  // Pointer position across the hero, from -0.5 to 0.5, smoothed with a spring.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const px = useSpring(rawX, SPRING);
  const py = useSpring(rawY, SPRING);
  // The same position in pixels, for the light that follows the cursor.
  const lightX = useMotionValue(0);
  const lightY = useMotionValue(0);
  const lightOpacity = useSpring(0, { stiffness: 80, damping: 20 });

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - box.left) / box.width - 0.5);
    rawY.set((e.clientY - box.top) / box.height - 0.5);
    lightX.set(e.clientX - box.left);
    lightY.set(e.clientY - box.top);
    lightOpacity.set(1);
  };
  const onPointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
    lightOpacity.set(0);
  };

  const { scrollY } = useScroll();
  const textY = useTransform(scrollY, [0, 600], reduce ? [0, 0] : [0, -60]);
  const textOpacity = useTransform(scrollY, [100, 600], reduce ? [1, 1] : [1, 0]);
  const chipX = useTransform(px, (v) => (reduce ? 0 : v * -30));
  const chipY = useTransform(py, (v) => (reduce ? 0 : v * -20));

  const after = (delay: number) =>
    reduce ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT, delay };

  const current = destinations[index % Math.max(destinations.length, 1)];

  return (
    <section
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative isolate mx-3 rounded-xl md:mx-5 mt-3 overflow-hidden bg-ink text-white md:mt-4"
    >
      {hasVideo ? (
        <video
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          src={siteConfig.heroVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      ) : (
        <HeroScene px={px} py={py} />
      )}

      {/* A soft light that follows the cursor */}
      <motion.div
        aria-hidden="true"
        style={{ x: lightX, y: lightY, opacity: lightOpacity }}
        className="pointer-events-none absolute left-0 top-0 -z-10 -ml-72 -mt-72 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgb(244_236_216/0.16)_0%,transparent_65%)]"
      />

      {/* Scrims keep the white text at AA contrast over the scene. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/25 md:hidden" />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 -z-10 hidden w-3/4 bg-linear-to-r from-ink/80 via-ink/45 to-transparent md:block"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-linear-to-t from-ink/85 to-transparent"
      />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="container-page flex min-h-[32rem] flex-col justify-center pb-10 pt-14 md:min-h-[36rem] md:pt-20 lg:min-h-[40rem]"
      >
        <motion.p
          className="eyebrow text-cream"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={after(0)}
        >
          {text.eyebrow}
        </motion.p>

        <h1 className="mt-4 text-[2.75rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-[5.25rem]">
          {headline.map((line, li) => (
            <span key={li} className={li === 1 ? "block text-cream" : "block"}>
              {line.map((word, wi) => (
                <Fragment key={`${wi}-${word}`}>
                  <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
                    <motion.span
                      className="inline-block"
                      initial={{ y: "110%" }}
                      animate={{ y: 0 }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { duration: 0.7, ease: EASE_OUT, delay: 0.1 + (li * headline[0].length + wi) * 0.07 }
                      }
                    >
                      {word}
                    </motion.span>
                  </span>{" "}
                </Fragment>
              ))}
            </span>
          ))}
        </h1>

        <motion.p
          className="mt-5 max-w-xl text-lg leading-relaxed text-white md:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={after(0.75)}
        >
          {text.intro}
        </motion.p>

        <motion.div
          className="mt-7 flex flex-col gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={after(0.9)}
        >
          <Link href="/packages" className={buttonClass("cream", "lg")}>
            {text.primaryButton}
          </Link>
          <Link href="/plan-my-trip" className={buttonClass("outlineLight", "lg")}>
            {text.secondaryButton}
          </Link>
        </motion.div>
      </motion.div>

      {/* Floating destination chips, on wide screens where there is room beside the headline */}
      <motion.nav
        aria-label="Popular destinations"
        style={{ x: chipX, y: chipY }}
        className="absolute inset-0 hidden xl:block pointer-events-none"
      >
        <ul>
          {destinations.slice(0, CHIP_SPOTS.length).map((d, i) => (
            <motion.li
              key={d.slug}
              className={`pointer-events-auto absolute ${CHIP_SPOTS[i]}`}
              initial={reduce ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT, delay: 1.6 + i * 0.25 }}
            >
              <motion.div
                animate={reduce ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
              >
                <Link
                  href={`/destinations/${d.slug}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-white/12 px-4 text-[0.9375rem] font-semibold text-white shadow-lift backdrop-blur-md transition-[transform,background-color,color] duration-200 hover:scale-105 hover:bg-cream hover:text-ink"
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {d.name}
                </Link>
              </motion.div>
            </motion.li>
          ))}
        </ul>
      </motion.nav>

      <motion.div
        className="container-page relative pb-8 lg:pb-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={after(1.05)}
      >
        {current && (
          <p className="mb-3 flex w-fit items-center gap-2 rounded-full border border-white/15 bg-ink/65 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur-md">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cream opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cream" />
            </span>
            {text.rotatingLabel}
            <span className="relative inline-flex h-5 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={current.slug}
                  className="font-semibold text-cream"
                  initial={reduce ? false : { y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={reduce ? undefined : { y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                >
                  {current.name}
                </motion.span>
              </AnimatePresence>
            </span>
          </p>
        )}
        {search}
      </motion.div>
    </section>
  );
}
