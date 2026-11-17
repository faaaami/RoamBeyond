"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { EASE_OUT } from "../SectionReveal";
import { RANGES, SCENE_H, SCENE_W, STARS } from "./scene-geometry";

/** The dashed flight path. The plane follows the same curve. */
const ROUTE = "M 740 600 C 860 430 1010 330 1180 300 S 1380 330 1460 390";

/**
 * Moves a layer with the pointer and with page scroll. Bigger `depth` means the
 * layer feels closer. `px` and `py` run from -0.5 to 0.5 across the hero.
 */
function useDrift(
  px: MotionValue<number>,
  py: MotionValue<number>,
  scrollY: MotionValue<number>,
  depth: number,
  scrollShift: number,
  still: boolean,
) {
  const x = useTransform(px, (v) => (still ? 0 : v * depth));
  const y = useTransform<number, number>([py, scrollY], ([p, s]) =>
    still ? 0 : p * depth * 0.6 + (Math.min(s, 700) / 700) * scrollShift,
  );
  return { x, y };
}

/**
 * The illustrated hero background: a moonlit night over the Himalayas, in the
 * brand greens. No photos: every shape is generated (see scene-geometry.ts)
 * and textured with SVG filters.
 *
 * - Sky: slow-drifting colour glows, twinkling stars and film grain.
 * - Moon: a shaded sphere with seas, craters and a soft halo. It rises on load.
 * - Route: a dashed flight path draws itself, then a plane flies along it on a loop.
 * - Mountains: a snow range and a rocky range with moonlit and shadowed faces,
 *   then two forested ridges. Haze thickens with distance and mist drifts between.
 * - Each range is its own layer, so its texture is drawn once and then only moved.
 * - Depth: every layer shifts with the pointer and with scroll, nearer layers more.
 * - Reduced motion: the finished scene, completely still.
 * - Only transform and opacity are animated.
 */
export function HeroScene({ px, py }: { px: MotionValue<number>; py: MotionValue<number> }) {
  const still = Boolean(useReducedMotion());
  const { scrollY } = useScroll();

  const sky = useDrift(px, py, scrollY, 8, 40, still);
  const sun = useDrift(px, py, scrollY, 18, 110, still);
  const far = useDrift(px, py, scrollY, 10, 70, still);
  const mid = useDrift(px, py, scrollY, 18, 45, still);
  const near = useDrift(px, py, scrollY, 28, 22, still);
  const front = useDrift(px, py, scrollY, 40, 0, still);

  /** Entrance for a mountain range: rises into place, `order` staggers the ranges. */
  const rise = (order: number) => ({
    initial: still ? false : ({ y: 70, opacity: 0 } as const),
    animate: { y: 0, opacity: 1 },
    transition: { duration: 1.1, ease: EASE_OUT, delay: 0.15 + order * 0.14 },
  });
  const loop = (duration: number, delay = 0) =>
    ({ duration, delay, repeat: Infinity, ease: "easeInOut" }) as const;

  return (
    <div aria-hidden="true" className="absolute inset-0 -z-20 overflow-hidden">
      {/* Sky: night green at the top, warming towards the horizon */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b1d15_0%,#12291e_30%,#1a4a33_62%,#2b7350_100%)]" />

      {/* Colour glows that drift slowly */}
      <motion.div
        className="absolute -left-40 -top-40 h-[40rem] w-[40rem] rounded-full bg-green-light/45 blur-3xl"
        animate={still ? undefined : { x: [0, 70, 0], y: [0, 50, 0] }}
        transition={loop(22)}
      />
      <motion.div
        className="absolute -right-32 top-[8%] h-[34rem] w-[34rem] rounded-full bg-[#e9b25f]/20 blur-3xl"
        animate={still ? undefined : { x: [0, -60, 0], y: [0, 40, 0], scale: [1, 1.12, 1] }}
        transition={loop(18, 1)}
      />
      <motion.div
        className="absolute bottom-[18%] left-[30%] h-[26rem] w-[44rem] rounded-full bg-[#5fb7a3]/15 blur-3xl"
        animate={still ? undefined : { x: [0, 90, 0] }}
        transition={loop(26, 2)}
      />

      {/* Stars */}
      <motion.div style={sky} className="absolute inset-0">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="absolute animate-twinkle rounded-full bg-cream"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </motion.div>

      {/* Moon */}
      <motion.div style={sun} className="absolute right-4 top-4 md:right-[6%] md:top-[7%]">
        <motion.div
          className="relative h-16 w-16 md:h-36 md:w-36"
          initial={still ? false : { y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.8, ease: EASE_OUT, delay: 0.2 }}
        >
          {/* Halo: moonlight scattering in thin air */}
          <motion.span
            className="absolute -inset-[140%] rounded-full bg-[radial-gradient(circle,rgb(244_236_216/0.22)_0%,rgb(244_236_216/0.08)_30%,transparent_62%)]"
            animate={still ? undefined : { opacity: [0.75, 1, 0.75] }}
            transition={loop(9)}
          />
          <span className="absolute -inset-[6%] rounded-full bg-cream/30 blur-md" />
          <Moon />
        </motion.div>
      </motion.div>

      {/* Flight route. Desktop only: on small screens the headline needs the space. */}
      <svg
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 hidden h-full w-full md:block"
      >
        <defs>
          <mask id="hero-route-reveal">
            <motion.path
              d={ROUTE}
              fill="none"
              stroke="#fff"
              strokeWidth="10"
              initial={still ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.4, ease: "easeInOut", delay: 0.9 }}
            />
          </mask>
        </defs>
        <path
          id="hero-route"
          d={ROUTE}
          fill="none"
          stroke="#f4ecd8"
          strokeOpacity="0.7"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="1 11"
          mask="url(#hero-route-reveal)"
        />
        {/* Start point */}
        <circle cx="740" cy="600" r="5" fill="#f4ecd8" />
        {!still && (
          <>
            <motion.circle
              cx="740"
              cy="600"
              r="5"
              fill="none"
              stroke="#f4ecd8"
              style={{ transformOrigin: "740px 600px" }}
              animate={{ scale: [1, 3.4], opacity: [0.7, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
            />
            {/* The plane starts once the route has been drawn, then loops. */}
            <g opacity="0">
              <path d="M10 0 L-10 -7 L-5 0 L-10 7 Z" fill="#fffaf0" />
              <animateMotion dur="12s" begin="3.2s" repeatCount="indefinite" rotate="auto">
                <mpath href="#hero-route" />
              </animateMotion>
              <animate
                attributeName="opacity"
                dur="12s"
                begin="3.2s"
                repeatCount="indefinite"
                values="0;1;1;0"
                keyTimes="0;0.05;0.9;1"
              />
            </g>
          </>
        )}
      </svg>

      {/* Mountains, anchored to the bottom edge. Back to front. */}
      <Range drift={far} entrance={rise(0)}>
        <defs>
          {/* Moonlit rock, paling into haze towards the valley */}
          <linearGradient id="far-fill" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="430">
            <stop offset="0" stopColor="#7fa79a" />
            <stop offset="0.5" stopColor="#5f9482" />
            <stop offset="1" stopColor="#6aa08a" />
          </linearGradient>
          <linearGradient id="far-shade" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="430">
            <stop offset="0" stopColor="#0f2c33" stopOpacity="0.66" />
            <stop offset="0.55" stopColor="#0f2c33" stopOpacity="0.5" />
            <stop offset="1" stopColor="#0f2c33" stopOpacity="0.08" />
          </linearGradient>
          <clipPath id="far-clip">
            <path d={RANGES.far.shape} />
          </clipPath>
          <RockFilter id="far-rock" frequency="0.05 0.014" relief={3} seed={2} />
        </defs>
        <path d={RANGES.far.shape} fill="url(#far-fill)" />
        <g clipPath="url(#far-clip)">
          <path d={RANGES.far.gullies} fill="none" stroke="#12303a" strokeOpacity="0.28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={RANGES.far.snow} fill="#fbf8ee" />
          <rect x="-90" y="0" width="1620" height="620" filter="url(#far-rock)" opacity="0.4" style={{ mixBlendMode: "multiply" }} />
          {/* Shadow goes over the snow too, so snow on the dark faces turns blue-grey. */}
          <path d={RANGES.far.shadow} fill="url(#far-shade)" />
        </g>
      </Range>

      <Mist className="bottom-[22%] left-[-10%] h-[10%] w-[60%]" travel={420} seconds={38} still={still} />

      <Range drift={mid} entrance={rise(1)}>
        <defs>
          <linearGradient id="mid-fill" gradientUnits="userSpaceOnUse" x1="0" y1="230" x2="0" y2="520">
            <stop offset="0" stopColor="#3a7a62" />
            <stop offset="0.55" stopColor="#2a614c" />
            <stop offset="1" stopColor="#34745b" />
          </linearGradient>
          <linearGradient id="mid-shade" gradientUnits="userSpaceOnUse" x1="0" y1="230" x2="0" y2="520">
            <stop offset="0" stopColor="#08191a" stopOpacity="0.68" />
            <stop offset="0.6" stopColor="#08191a" stopOpacity="0.5" />
            <stop offset="1" stopColor="#08191a" stopOpacity="0.1" />
          </linearGradient>
          <clipPath id="mid-clip">
            <path d={RANGES.mid.shape} />
          </clipPath>
          <RockFilter id="mid-rock" frequency="0.045 0.012" relief={4} seed={8} />
        </defs>
        <path d={RANGES.mid.shape} fill="url(#mid-fill)" />
        <g clipPath="url(#mid-clip)">
          <path d={RANGES.mid.gullies} fill="none" stroke="#08191a" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="-90" y="0" width="1620" height="620" filter="url(#mid-rock)" opacity="0.45" style={{ mixBlendMode: "multiply" }} />
          <path d={RANGES.mid.shadow} fill="url(#mid-shade)" />
        </g>
      </Range>

      <Mist className="bottom-[10%] right-[-10%] h-[8%] w-[55%]" travel={-380} seconds={32} still={still} />

      <Range drift={near} entrance={rise(2)}>
        <defs>
          <linearGradient id="near-fill" gradientUnits="userSpaceOnUse" x1="0" y1="380" x2="0" y2="560">
            <stop offset="0" stopColor="#173f2e" />
            <stop offset="1" stopColor="#1d4d39" />
          </linearGradient>
        </defs>
        <path d={RANGES.near.trees} fill="#173f2e" />
        <path d={RANGES.near.shape} fill="url(#near-fill)" />
      </Range>

      <Range drift={front} entrance={rise(3)}>
        <path d={RANGES.front.trees} fill="#0c1f17" />
        <path d={RANGES.front.shape} fill="#0c1f17" />
      </Range>

      {/* Film grain, so the flat colours feel printed rather than digital */}
      <svg className="absolute inset-0 h-full w-full opacity-25 mix-blend-soft-light">
        <filter id="hero-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-grain)" />
      </svg>
    </div>
  );
}

// Taller on phones, where the search form covers the lower part of the scene.
const RANGE_BOX = "absolute inset-x-0 bottom-0 h-[70%] md:h-[58%] will-change-transform";

/** One mountain range on its own layer: the outer element drifts, the inner one rises in on load. */
function Range({
  drift,
  entrance,
  children,
}: {
  drift: { x: MotionValue<number>; y: MotionValue<number> };
  entrance: Pick<React.ComponentProps<typeof motion.svg>, "initial" | "animate" | "transition">;
  children: React.ReactNode;
}) {
  return (
    <motion.div style={drift} className={RANGE_BOX}>
      <motion.svg
        {...entrance}
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        preserveAspectRatio="xMidYMax slice"
        className="h-full w-full overflow-visible"
      >
        {children}
      </motion.svg>
    </motion.div>
  );
}

/**
 * Rock relief: fractal noise used as a height map and lit from the upper right,
 * where the moon is. Multiplied over a range it adds gullies and ribs.
 */
function RockFilter({ id, frequency, relief, seed }: { id: string; frequency: string; relief: number; seed: number }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves="5" seed={seed} result="noise" />
      <feDiffuseLighting in="noise" surfaceScale={relief} diffuseConstant="1.15" lightingColor="#ffffff">
        <feDistantLight azimuth="315" elevation="42" />
      </feDiffuseLighting>
    </filter>
  );
}

/** A band of valley mist that drifts sideways. */
function Mist({
  className,
  travel,
  seconds,
  still,
}: {
  className: string;
  travel: number;
  seconds: number;
  still: boolean;
}) {
  return (
    <motion.div
      className={`absolute rounded-full bg-[#dcebe2]/25 blur-2xl ${className}`}
      animate={still ? undefined : { x: [0, travel, 0] }}
      transition={{ duration: seconds, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/** Craters: [x, y, radius] on a 200 x 200 disc. */
const CRATERS = [
  [62, 58, 9],
  [128, 44, 6],
  [150, 96, 11],
  [96, 118, 7],
  [56, 132, 12],
  [118, 158, 8],
  [84, 82, 4],
  [142, 138, 5],
  [106, 62, 3.5],
  [70, 100, 3],
  [160, 66, 3.5],
  [92, 150, 3],
];

/**
 * The moon, drawn rather than photographed: a lit sphere with dark seas made
 * from noise, a finely pitted surface, a few rimmed craters and a shaded limb.
 */
function Moon() {
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
      <defs>
        <radialGradient id="moon-base" cx="58%" cy="40%" r="70%">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="0.55" stopColor="#f1ecdb" />
          <stop offset="1" stopColor="#d4cdb6" />
        </radialGradient>
        {/* Night side: the moon is lit from the upper right, so the lower left falls away. */}
        <radialGradient id="moon-shade" cx="66%" cy="32%" r="85%">
          <stop offset="0.45" stopColor="#0d2019" stopOpacity="0" />
          <stop offset="0.8" stopColor="#0d2019" stopOpacity="0.42" />
          <stop offset="1" stopColor="#0d2019" stopOpacity="0.8" />
        </radialGradient>
        <radialGradient id="moon-crater" cx="38%" cy="38%" r="62%">
          <stop offset="0" stopColor="#8c8672" stopOpacity="0.5" />
          <stop offset="0.7" stopColor="#a39d88" stopOpacity="0.28" />
          <stop offset="0.86" stopColor="#fffdf4" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fffdf4" stopOpacity="0" />
        </radialGradient>
        <clipPath id="moon-clip">
          <circle cx="100" cy="100" r="98" />
        </clipPath>
        {/* Seas: large soft dark patches where the noise is strongest */}
        <filter id="moon-seas" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="3" seed="23" />
          <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.44  0 0 0 0 0.38  3.4 0 0 0 -1.55" />
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        {/* Pitted ground: fine noise lit from the same side as the sphere */}
        <filter id="moon-ground" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="4" seed="5" result="noise" />
          <feDiffuseLighting in="noise" surfaceScale="2.4" diffuseConstant="1.2" lightingColor="#ffffff">
            <feDistantLight azimuth="315" elevation="50" />
          </feDiffuseLighting>
        </filter>
      </defs>
      <g clipPath="url(#moon-clip)">
        <circle cx="100" cy="100" r="98" fill="url(#moon-base)" />
        <rect width="200" height="200" filter="url(#moon-ground)" opacity="0.32" style={{ mixBlendMode: "multiply" }} />
        <rect width="200" height="200" filter="url(#moon-seas)" opacity="0.75" />
        {CRATERS.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="url(#moon-crater)" />
        ))}
        <circle cx="100" cy="100" r="98" fill="url(#moon-shade)" />
      </g>
    </svg>
  );
}
