"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, PhoneCall } from "lucide-react";
import { useForm } from "react-hook-form";
import { callbackSchema, type CallbackInput } from "@/lib/enquiry-schema";
import { useEnquirySubmit } from "@/lib/use-enquiry-submit";
import { enquiryWhatsappLink } from "@/lib/whatsapp";
import { useSite } from "../SiteProvider";
import { buttonClass } from "../ui/button";
import { Field, FormError, Honeypot, fieldAria, inputClass } from "../ui/Field";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { ConsentField } from "./ConsentField";

/**
 * Quick call-back form: name and mobile only. Used on the landing page.
 * With `withMessage` it gains a message box and doubles as the contact form.
 */
export function CallbackForm({
  withMessage = false,
  idPrefix = "cb",
}: {
  withMessage?: boolean;
  idPrefix?: string;
}) {
  const { settings: site } = useSite();
  const { submit, serverError } = useEnquirySubmit();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CallbackInput>({
    resolver: zodResolver(callbackSchema),
    defaultValues: { kind: "callback", name: "", mobile: "", message: "", consent: false, website: "" },
  });

  const id = (name: string) => `${idPrefix}-${name}`;
  const openWhatsApp = () => {
    window.open(enquiryWhatsappLink(site.whatsapp.number, getValues()), "_blank", "noopener,noreferrer");
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="relative flex flex-col gap-4 rounded-xl bg-white p-5 text-ink shadow-lift md:p-7"
    >
      <input type="hidden" {...register("kind")} />
      <Honeypot>
        <label htmlFor={id("website")}>Website</label>
        <input id={id("website")} type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </Honeypot>

      <Field id={id("name")} label="Your name" error={errors.name?.message}>
        <input
          type="text"
          autoComplete="name"
          className={inputClass}
          {...fieldAria(id("name"), errors.name?.message)}
          {...register("name")}
        />
      </Field>

      <Field
        id={id("mobile")}
        label="Mobile number"
        hint="10-digit Indian mobile number"
        error={errors.mobile?.message}
      >
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

      {withMessage && (
        <Field id={id("message")} label="Message" optional error={errors.message?.message}>
          <textarea
            rows={4}
            placeholder="How can we help?"
            className={`${inputClass} py-3`}
            {...fieldAria(id("message"), errors.message?.message)}
            {...register("message")}
          />
        </Field>
      )}

      <ConsentField id={id("consent")} registration={register("consent")} error={errors.consent?.message} />

      <FormError message={serverError} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={isSubmitting} className={buttonClass("primary", "lg", "flex-1")}>
          {isSubmitting ? (
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <PhoneCall className="h-5 w-5" aria-hidden="true" />
          )}
          {isSubmitting ? "Sending" : withMessage ? "Send message" : "Call me back"}
        </button>
        <button type="button" onClick={openWhatsApp} className={buttonClass("whatsapp", "lg", "flex-1")}>
          <WhatsAppIcon className="h-5 w-5" />
          Send on WhatsApp
        </button>
      </div>
    </form>
  );
}
