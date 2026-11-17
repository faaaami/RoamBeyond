"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  islands,
  outlinePath,
  routePath,
  stops,
} from "./india-map";

/** Timing of the route animation, in seconds. Pins are scheduled against the same clock. */
const ROUTE_DELAY = 0.7;
const ROUTE_DURATION = 3.2;

/**
* Stylised map of India. When it scrolls into view the route draws itself north to south and
 * each pin drops in as the line reaches it.
 *
 * - Map fade-in: in view, 0.8s ease-out.
 * - Route: in view, pathLength 0 to 1, 3.2s easeInOut, 0.7s delay.
 * - Pins: opacity and y (-22px to 0), spring (stiffness 420, damping 16),
 *   delayed to match the route's progress.
 * - Delhi pulse: scale 1 to 2.6 with opacity 0.5 to 0, 2.4s loop.
 * - Reduced motion: everything is drawn in its final state, no pulse.
 */
export function HeroMap() {
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  // Start the animation the first time a third of the map is on screen.
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const instant = { duration: 0 } as const;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="Map of India with a route linking Kashmir, Ladakh, Himachal, Delhi, Rajasthan, Goa, Kerala and the Andaman Islands"
      className="h-auto w-full overflow-visible"
    >
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: inView ? 1 : 0 }}
        transition={reduce ? instant : { duration: 0.8, ease: "easeOut" }}
      >
        <path
          d={outlinePath}
          fill="#2B7350"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {islands.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" fill="#2B7350" stroke="rgba(255,255,255,0.35)" />
        ))}
        {/* Faint guide showing where the route will run */}
        <path
          d={routePath}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="2"
          strokeDasharray="2 8"
          strokeLinecap="round"
        />
      </motion.g>

      <motion.path
        d={routePath}
        fill="none"
        stroke="#F4ECD8"
        strokeWidth="3.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: inView ? 1 : 0 }}
        transition={
          reduce ? instant : { duration: ROUTE_DURATION, ease: "easeInOut", delay: ROUTE_DELAY }
        }
      />

      {stops.map((stop) => {
        const delay = ROUTE_DELAY + easeInOutInverse(stop.progress) * ROUTE_DURATION;
        const isHome = stop.name === "Delhi";
        const labelX = stop.side === "left" ? -16 : 16;

        return (
          <g key={stop.name} transform={`translate(${stop.x} ${stop.y})`}>
            {isHome && !reduce && inView && (
              <motion.circle
                r="9"
                fill="#F4ECD8"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: delay + 0.4 }}
              />
            )}
            <motion.g
              initial={{ opacity: 0, y: -22 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -22 }}
              transition={
                reduce
                  ? instant
                  : {
                      y: { type: "spring", stiffness: 420, damping: 16, delay },
                      opacity: { duration: 0.2, delay },
                    }
              }
            >
              <circle r={isHome ? 9 : 7} fill="#F4ECD8" stroke="#12291E" strokeWidth="3" />
              <text
                x={labelX}
                y="6"
                textAnchor={stop.side === "left" ? "end" : "start"}
                fontSize="19"
                fontWeight="600"
                fill="#FFFFFF"
                stroke="#1F5A3D"
                strokeWidth="5"
                paintOrder="stroke"
                style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
              >
                {stop.name}
              </text>
            </motion.g>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * The route uses easeInOut, so the line reaches a point that is `p` of the way
 * along at a time later (or earlier) than `p`. This inverts the cubic easeInOut
 * curve closely enough for the pins to land as the line arrives.
 */
function easeInOutInverse(p: number): number {
  return p < 0.5 ? Math.cbrt(p / 4) : 1 - Math.cbrt((1 - p) / 4);
}
