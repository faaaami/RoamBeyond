"use client";

import { motion, useReducedMotion, useScroll } from "framer-motion";
import { Map, PhoneCall, Send } from "lucide-react";
import { useRef } from "react";
import { SectionHeading } from "../SectionHeading";
import type { HomeContent } from "@/lib/content";
import { SectionReveal } from "../SectionReveal";

/** Icons for the steps, in order. The wording comes from the admin. */
const ICONS = [Map, Send, PhoneCall];

/**
 * The line joining the three steps draws itself as the section scrolls through
 * the viewport (useScroll + pathLength). Horizontal on desktop, vertical on mobile.
 * Trigger: section top at 80% of the viewport to section bottom at 60%.
 * Reduced motion: the line is fully drawn.
 */
export function HowItWorks({ content }: { content: HomeContent["howItWorks"] }) {
  const steps = content.steps.map((step, i) => ({ ...step, icon: ICONS[i % ICONS.length] }));
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.6"] });
  const pathLength = reduce ? 1 : scrollYProgress;

  return (
    <section className="mx-3 rounded-xl md:mx-5 border border-line bg-white py-14 md:py-20">
      <div className="container-page">
        <SectionReveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            lead={content.lead}
          />
        </SectionReveal>

        <ol ref={ref} className="relative mt-10 grid gap-10 md:mt-14 md:grid-cols-3 md:gap-8">
          {/* Desktop: horizontal line through the centres of the step numbers */}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 4"
            preserveAspectRatio="none"
            className="absolute left-[16.66%] top-7 hidden h-1 w-[66.67%] md:block"
          >
            <line x1="0" y1="2" x2="100" y2="2" className="stroke-line" strokeWidth="4" />
            <motion.line
              x1="0"
              y1="2"
              x2="100"
              y2="2"
              className="stroke-green"
              strokeWidth="4"
              style={{ pathLength }}
            />
          </svg>
          {/* Mobile: vertical line down the left edge */}
          <svg
            aria-hidden="true"
            viewBox="0 0 4 100"
            preserveAspectRatio="none"
            className="absolute bottom-16 left-[1.625rem] top-7 h-auto w-1 md:hidden"
          >
            <line x1="2" y1="0" x2="2" y2="100" className="stroke-line" strokeWidth="4" />
            <motion.line
              x1="2"
              y1="0"
              x2="2"
              y2="100"
              className="stroke-green"
              strokeWidth="4"
              style={{ pathLength }}
            />
          </svg>

          {steps.map((step, i) => (
            <li key={`${i}-${step.title}`} className="relative flex gap-5 md:flex-col md:items-center md:text-center">
              <span className="relative z-10 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green font-display text-xl font-extrabold text-white ring-8 ring-white">
                {i + 1}
              </span>
              <div>
                <step.icon className="hidden h-6 w-6 text-green md:mx-auto md:block" aria-hidden="true" />
                <h3 className="text-2xl font-bold md:mt-3">{step.title}</h3>
                <p className="mt-2 max-w-xs leading-relaxed text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
