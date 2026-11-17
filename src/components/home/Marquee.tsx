/**
 * Slow strip of place names. Pure CSS: translateX 0 to -50% over 48s, linear, infinite.
 * The list is rendered twice so the loop is seamless. Pauses on hover; stops entirely
 * under prefers-reduced-motion (see globals.css). Decorative, so hidden from screen readers.
 */
export function Marquee({ names }: { names: string[] }) {
  if (names.length === 0) return null;

  return (
    <div aria-hidden="true" className="mx-3 rounded-xl md:mx-5 my-3 overflow-hidden bg-green py-4 text-cream md:my-5 md:py-5">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {names.map((name, i) => (
              <li
                key={`${i}-${name}`}
                className="flex items-center font-display text-2xl font-extrabold uppercase tracking-tight md:text-3xl"
              >
                <span className="px-5 md:px-7">{name}</span>
                <span className="h-2 w-2 rounded-full bg-cream/60" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
