import { BedDouble, ChevronDown, Utensils } from "lucide-react";
import type { ItineraryDay as ItineraryDayData } from "@/data/types";

/**
 * One day of the itinerary as a native <details> disclosure, so it works
 * without JavaScript and is keyboard and screen-reader friendly by default.
 */
export function ItineraryDay({ day, defaultOpen = false }: { day: ItineraryDayData; defaultOpen?: boolean }) {
  return (
    <li className="relative pl-14">
      {/* Timeline rail and day marker */}
      <span aria-hidden="true" className="absolute bottom-0 left-5 top-0 w-0.5 bg-line" />
      <span
        aria-hidden="true"
        className="absolute left-0 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-green font-display text-sm font-extrabold text-white ring-4 ring-paper"
      >
        {day.day}
      </span>

      <details open={defaultOpen} className="group mb-3 rounded-lg border border-line bg-white open:shadow-card">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-3 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="eyebrow block text-xs text-green">Day {day.day}</span>
            <span className="font-display text-lg font-bold leading-snug md:text-xl">{day.title}</span>
          </span>
          <ChevronDown
            className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="px-5 pb-5">
          <p className="leading-relaxed text-muted">{day.description}</p>
          {(day.meals || day.stay) && (
            <ul className="mt-4 flex flex-col gap-2 text-sm font-medium text-ink sm:flex-row sm:flex-wrap sm:gap-x-6">
              {day.meals && (
                <li className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-green" aria-hidden="true" />
                  {day.meals}
                </li>
              )}
              {day.stay && (
                <li className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-green" aria-hidden="true" />
                  {day.stay}
                </li>
              )}
            </ul>
          )}
        </div>
      </details>
    </li>
  );
}
