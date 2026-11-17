"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { customTripSchema, type CustomTripInput } from "@/lib/enquiry-schema";
import { useEnquirySubmit } from "@/lib/use-enquiry-submit";
import { enquiryWhatsappLink } from "@/lib/whatsapp";
import { useSite } from "../SiteProvider";
import { buttonClass } from "../ui/button";
import { Field, FormError, Honeypot, fieldAria, inputClass } from "../ui/Field";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { ConsentField } from "./ConsentField";

const durationOptions = ["2 to 3 days", "4 to 5 days", "6 to 7 days", "8 to 10 days", "More than 10 days"];

function Group({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-line bg-white p-5 md:p-8">
      <legend className="float-left mb-5 flex w-full items-center gap-3 font-display text-2xl font-bold">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green text-base text-white">
          {step}
        </span>
        {title}
      </legend>
      <div className="clear-both grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Custom trip request: about you, who is travelling, the trip, consent. */
export function PlanTripForm({ defaultDestination = "" }: { defaultDestination?: string }) {
  const { settings: site, tripTypes } = useSite();
  const { submit, serverError } = useEnquirySubmit();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<CustomTripInput>({
    resolver: zodResolver(customTripSchema),
    defaultValues: {
      kind: "custom",
      name: "",
      mobile: "",
      email: "",
      departureCity: "",
      destination: defaultDestination,
      travelDate: "",
      duration: "",
      budget: "",
      adults: 2,
      children: 0,
      message: "",
      consent: false,
      website: "",
    },
  });

  const errorCount = Object.keys(errors).length;
  const openWhatsApp = () => {
    window.open(enquiryWhatsappLink(site.whatsapp.number, getValues()), "_blank", "noopener,noreferrer");
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="relative flex flex-col gap-5">
      <input type="hidden" {...register("kind")} />
      <Honeypot>
        <label htmlFor="pt-website">Website</label>
        <input id="pt-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </Honeypot>

      <Group step={1} title="About you">
        <Field id="pt-name" label="Your name" error={errors.name?.message}>
          <input
            type="text"
            autoComplete="name"
            className={inputClass}
            {...fieldAria("pt-name", errors.name?.message)}
            {...register("name")}
          />
        </Field>
        <Field id="pt-mobile" label="Mobile number" error={errors.mobile?.message}>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="98XXX XXXXX"
            className={inputClass}
            {...fieldAria("pt-mobile", errors.mobile?.message)}
            {...register("mobile")}
          />
        </Field>
        <Field id="pt-email" label="Email" optional error={errors.email?.message}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            className={inputClass}
            {...fieldAria("pt-email", errors.email?.message)}
            {...register("email")}
          />
        </Field>
        <Field id="pt-city" label="Travelling from" optional error={errors.departureCity?.message}>
          <input
            type="text"
            autoComplete="address-level2"
            placeholder="Your city"
            className={inputClass}
            {...fieldAria("pt-city", errors.departureCity?.message)}
            {...register("departureCity")}
          />
        </Field>
      </Group>

      <Group step={2} title="Who is travelling">
        <Field id="pt-type" label="Trip type" error={errors.tripType?.message} className="md:col-span-2">
          <select
            defaultValue=""
            className={inputClass}
            {...fieldAria("pt-type", errors.tripType?.message)}
            {...register("tripType")}
          >
            <option value="" disabled>
              Select a trip type
            </option>
            {tripTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="pt-adults" label="Adults" error={errors.adults?.message}>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            className={inputClass}
            {...fieldAria("pt-adults", errors.adults?.message)}
            {...register("adults", { valueAsNumber: true })}
          />
        </Field>
        <Field id="pt-children" label="Children (under 12)" error={errors.children?.message}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            className={inputClass}
            {...fieldAria("pt-children", errors.children?.message)}
            {...register("children", { valueAsNumber: true })}
          />
        </Field>
      </Group>

      <Group step={3} title="The trip">
        <Field
          id="pt-destination"
          label="Where would you like to go?"
          hint="One place or several. Not sure? Write 'suggest something'."
          error={errors.destination?.message}
          className="md:col-span-2"
        >
          <input
            type="text"
            placeholder="e.g. Kashmir, or Kerala and Goa"
            className={inputClass}
            {...fieldAria("pt-destination", errors.destination?.message)}
            {...register("destination")}
          />
        </Field>
        <Field id="pt-date" label="Travel date" optional error={errors.travelDate?.message}>
          <input
            type="date"
            className={inputClass}
            {...fieldAria("pt-date", errors.travelDate?.message)}
            {...register("travelDate")}
          />
        </Field>
        <Field id="pt-duration" label="How long?" optional error={errors.duration?.message}>
          <select className={inputClass} {...fieldAria("pt-duration", errors.duration?.message)} {...register("duration")}>
            <option value="">Not sure yet</option>
            {durationOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="pt-budget"
          label="Budget per person"
          optional
          error={errors.budget?.message}
          className="md:col-span-2"
        >
          <select className={inputClass} {...fieldAria("pt-budget", errors.budget?.message)} {...register("budget")}>
            <option value="">Not sure yet</option>
            {site.budgets.map((b) => (
              <option key={b.id} value={`${b.label} (${b.range})`}>
                {b.label}: {b.range}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="pt-message"
          label="Tell us more"
          optional
          error={errors.message?.message}
          className="md:col-span-2"
        >
          <textarea
            rows={4}
            placeholder="Hotel preference, must-see places, special occasions, dietary needs."
            className={`${inputClass} py-3`}
            {...fieldAria("pt-message", errors.message?.message)}
            {...register("message")}
          />
        </Field>
      </Group>

      <div className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5 md:p-8">
        <ConsentField id="pt-consent" registration={register("consent")} error={errors.consent?.message} />

        {submitCount > 0 && errorCount > 0 && (
          <FormError
            message={`Please fix ${errorCount} ${errorCount === 1 ? "field" : "fields"} above before sending.`}
          />
        )}
        <FormError message={serverError} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" disabled={isSubmitting} className={buttonClass("primary", "lg", "sm:flex-1")}>
            {isSubmitting && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Sending" : "Send my trip request"}
          </button>
          <button type="button" onClick={openWhatsApp} className={buttonClass("whatsapp", "lg", "sm:flex-1")}>
            <WhatsAppIcon className="h-5 w-5" />
            Send on WhatsApp
          </button>
        </div>
      </div>
    </form>
  );
}
