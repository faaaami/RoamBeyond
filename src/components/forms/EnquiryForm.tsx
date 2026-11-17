"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { packageEnquirySchema, type PackageEnquiryInput } from "@/lib/enquiry-schema";
import { useEnquirySubmit } from "@/lib/use-enquiry-submit";
import { enquiryWhatsappLink } from "@/lib/whatsapp";
import { useSite } from "../SiteProvider";
import { buttonClass } from "../ui/button";
import { Field, FormError, Honeypot, fieldAria, inputClass } from "../ui/Field";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { ConsentField } from "./ConsentField";

/**
 * Package enquiry form. The package name is filled in automatically and sent
 * with the enquiry. `idPrefix` keeps input ids unique if the form appears twice on a page.
 */
export function EnquiryForm({
  packageName,
  packageSlug,
  idPrefix = "enq",
}: {
  packageName: string;
  packageSlug: string;
  idPrefix?: string;
}) {
  const { settings: site, tripTypes } = useSite();
  const { submit, serverError } = useEnquirySubmit();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<PackageEnquiryInput>({
    resolver: zodResolver(packageEnquirySchema),
    defaultValues: {
      kind: "package",
      packageName,
      packageSlug,
      name: "",
      mobile: "",
      email: "",
      travelDate: "",
      adults: 2,
      children: 0,
      message: "",
      consent: false,
      website: "",
    },
  });

  const id = (name: string) => `${idPrefix}-${name}`;
  const openWhatsApp = () => {
    window.open(enquiryWhatsappLink(site.whatsapp.number, getValues()), "_blank", "noopener,noreferrer");
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="relative flex flex-col gap-4">
      <input type="hidden" {...register("kind")} />
      <input type="hidden" {...register("packageSlug")} />
      <Honeypot>
        <label htmlFor={id("website")}>Website</label>
        <input id={id("website")} type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </Honeypot>

      <Field id={id("package")} label="Package">
        <input
          id={id("package")}
          type="text"
          readOnly
          className={`${inputClass} bg-mist font-semibold`}
          {...register("packageName")}
        />
      </Field>

      <Field id={id("name")} label="Your name" error={errors.name?.message}>
        <input
          type="text"
          autoComplete="name"
          className={inputClass}
          {...fieldAria(id("name"), errors.name?.message)}
          {...register("name")}
        />
      </Field>

      <Field id={id("mobile")} label="Mobile number" error={errors.mobile?.message}>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98XXX XXXXX"
          className={inputClass}
          {...fieldAria(id("mobile"), errors.mobile?.message)}
          {...register("mobile")}
        />
      </Field>

      <Field id={id("email")} label="Email" optional error={errors.email?.message}>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          className={inputClass}
          {...fieldAria(id("email"), errors.email?.message)}
          {...register("email")}
        />
      </Field>

      {/* Side by side only when both labels fit on one line; otherwise a wrapped label pushes one field lower. */}
      <div className="grid grid-cols-1 gap-3 min-[26rem]:grid-cols-2">
        <Field id={id("date")} label="Travel date" optional error={errors.travelDate?.message}>
          <input
            type="date"
            className={inputClass}
            {...fieldAria(id("date"), errors.travelDate?.message)}
            {...register("travelDate")}
          />
        </Field>
        <Field id={id("type")} label="Trip type" error={errors.tripType?.message}>
          <select
            defaultValue=""
            className={inputClass}
            {...fieldAria(id("type"), errors.tripType?.message)}
            {...register("tripType")}
          >
            <option value="" disabled>
              Select
            </option>
            {tripTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id={id("adults")} label="Adults" error={errors.adults?.message}>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            className={inputClass}
            {...fieldAria(id("adults"), errors.adults?.message)}
            {...register("adults", { valueAsNumber: true })}
          />
        </Field>
        <Field id={id("children")} label="Children" error={errors.children?.message}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            className={inputClass}
            {...fieldAria(id("children"), errors.children?.message)}
            {...register("children", { valueAsNumber: true })}
          />
        </Field>
      </div>

      <Field id={id("message")} label="Message" optional error={errors.message?.message}>
        <textarea
          rows={3}
          placeholder="Anything we should know? Hotel preference, special occasions, questions."
          className={`${inputClass} py-3`}
          {...fieldAria(id("message"), errors.message?.message)}
          {...register("message")}
        />
      </Field>

      <ConsentField id={id("consent")} registration={register("consent")} error={errors.consent?.message} />

      <FormError message={serverError} />

      <button type="submit" disabled={isSubmitting} className={buttonClass("primary", "lg")}>
        {isSubmitting && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
        {isSubmitting ? "Sending" : "Enquire now"}
      </button>
      <button type="button" onClick={openWhatsApp} className={buttonClass("whatsapp", "lg")}>
        <WhatsAppIcon className="h-5 w-5" />
        Send on WhatsApp
      </button>
      <p className="text-center text-sm text-muted">
        No payment needed. We call you back {site.callbackWindow}.
      </p>
    </form>
  );
}
