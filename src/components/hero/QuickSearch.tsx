import { Search } from "lucide-react";
import Form from "next/form";
import { getDestinations, getTripTypes, getVocabulary } from "@/lib/content";
import { buttonClass } from "../ui/button";

const selectClass =
  "block w-full min-h-12 rounded-lg border border-line bg-white px-3 text-base text-ink " +
  "focus:border-green focus:outline-none focus:ring-2 focus:ring-green/25";

/** Submits as a GET to /packages, so the choices land in the URL query string. */
export async function QuickSearch() {
  const [tripTypes, { durations }] = await Promise.all([getTripTypes(), getVocabulary()]);
  const destinations = await getDestinations();

  return (
    <Form
      action="/packages"
      className="grid gap-3 rounded-xl bg-white p-4 shadow-lift sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="qs-destination" className="text-sm font-semibold text-ink">
          Destination
        </label>
        <select id="qs-destination" name="destination" defaultValue="" className={selectClass}>
          <option value="">Anywhere in India</option>
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="qs-type" className="text-sm font-semibold text-ink">
          Trip type
        </label>
        <select id="qs-type" name="type" defaultValue="" className={selectClass}>
          <option value="">Any trip type</option>
          {tripTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="qs-duration" className="text-sm font-semibold text-ink">
          Duration
        </label>
        <select id="qs-duration" name="duration" defaultValue="" className={selectClass}>
          <option value="">Any length</option>
          {durations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className={buttonClass("primary", "md", "min-h-12 sm:col-span-3 lg:col-span-1")}>
        <Search className="h-4 w-4" aria-hidden="true" />
        Search
      </button>
    </Form>
  );
}
