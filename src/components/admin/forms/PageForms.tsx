"use client";

import { useActionState, useState } from "react";
import { changePasswordAction, type FormState } from "@/lib/admin/actions";
import type { Options } from "@/lib/admin/api";
import { buttonClass } from "@/components/ui/button";
import { Field, FormError, fieldAria, inputClass } from "@/components/ui/Field";
import { CheckboxGroupField, FormSection, FormTabs, ImageField, LinesField, NumberField, RecordForm, Repeater, SelectField, SwitchField, TextAreaField, TextField } from "../form";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const TOKENS = "You can type {callback-time}, {phone}, {email} or {hours} to insert the value from Site settings.";

/* ---------- Site settings ---------- */

export function SiteSettingsForm({ action, initial }: { action: Action; initial: object }) {
  return (
    <RecordForm action={action} initial={initial}>
      <FormTabs
        tabs={[
          {
            id: "contact",
            label: "Contact details",
            fields: ["phoneDisplay", "phoneHref", "whatsappDisplay", "whatsappNumber", "email", "hours", "callbackWindow"],
            content: (
              <FormSection columns={2}>
                <TextField name="phoneDisplay" label="Phone shown to visitors" placeholder="+91 98765 43210" />
                <TextField name="phoneHref" label="Number to dial" hint='Country code and digits only, e.g. +919800000000.' />
                <TextField name="whatsappDisplay" label="WhatsApp shown to visitors" />
                <TextField name="whatsappNumber" label="WhatsApp number" hint='Digits only, no "+", e.g. 919800000000.' />
                <TextField name="email" label="Email" type="email" />
                <TextField name="hours" label="Opening hours" />
                <TextField name="callbackWindow" label="Call-back time" hint='Completes "We call you back …", e.g. within 2 working hours.' />
              </FormSection>
            ),
          },
          {
            id: "address",
            label: "Office and social",
            fields: ["addressDisplay", "addressLocality", "addressRegion", "addressMapQuery", "instagram", "facebook", "youtube"],
            content: (
              <FormSection columns={2}>
                <div className="md:col-span-2">
                  <TextAreaField name="addressDisplay" label="Full address" rows={2} />
                </div>
                <TextField name="addressLocality" label="City" />
                <TextField name="addressRegion" label="State" />
                <div className="md:col-span-2">
                  <TextField name="addressMapQuery" label="Google Maps search" hint="What to search for on the contact page map." />
                </div>
                <TextField name="instagram" label="Instagram link" type="url" optional />
                <TextField name="facebook" label="Facebook link" type="url" optional />
                <TextField name="youtube" label="YouTube link" type="url" optional />
              </FormSection>
            ),
          },
          {
            id: "about",
            label: "About the agency",
            fields: ["tagline", "description"],
            content: (
              <FormSection>
                <TextField name="tagline" label="Tagline" />
                <TextAreaField name="description" label="Short description" hint="Shown in the footer and in Google results." rows={3} />
              </FormSection>
            ),
          },
          {
            id: "prices",
            label: "Prices and policies",
            fields: ["budgetValue", "budgetComfort", "budgetPremium", "cancellationTerms"],
            content: (
              <FormSection columns={2}>
                <TextField name="budgetValue" label="Value budget range" placeholder="under ₹20,000" />
                <TextField name="budgetComfort" label="Comfort budget range" />
                <TextField name="budgetPremium" label="Premium budget range" />
                <div className="md:col-span-2">
                  <LinesField name="cancellationTerms" label="Cancellation terms" hint="One point per line. Shown on every package page and on the terms page." rows={6} />
                </div>
              </FormSection>
            ),
          },
        ]}
      />
    </RecordForm>
  );
}

/* ---------- Home page ---------- */

export function HomePageForm({ action, initial, options }: { action: Action; initial: object; options: Options }) {
  const sectionFields = (prefix: string, label: string, withLead = true) => (
    <FormSection title={label} columns={2}>
      <TextField name={`${prefix}Eyebrow`} label="Small label" />
      <TextField name={`${prefix}Title`} label="Title" />
      {withLead && (
        <div className="md:col-span-2">
          <TextAreaField name={`${prefix}Lead`} label="Intro line" rows={2} />
        </div>
      )}
    </FormSection>
  );
  return (
    <RecordForm action={action} initial={initial}>
      <FormTabs
        tabs={[
          {
            id: "top",
            label: "Top of page",
            fields: ["heroEyebrow", "heroHeadlineLine1", "heroHeadlineLine2", "heroIntro", "heroPrimaryButton", "heroSecondaryButton", "heroRotatingLabel", "marquee"],
            content: (
              <FormSection columns={2}>
                <TextField name="heroEyebrow" label="Small label above the headline" />
                <TextField name="heroRotatingLabel" label="Label before the rotating destination name" />
                <TextField name="heroHeadlineLine1" label="Headline, first line" />
                <TextField name="heroHeadlineLine2" label="Headline, second line" hint="Shown in cream." />
                <div className="md:col-span-2">
                  <TextAreaField name="heroIntro" label="Text under the headline" rows={3} />
                </div>
                <TextField name="heroPrimaryButton" label="First button (goes to Packages)" />
                <TextField name="heroSecondaryButton" label="Second button (goes to Plan my trip)" />
                <div className="md:col-span-2">
                  <LinesField name="marquee" label="Moving strip of place names" hint="One place per line." rows={4} />
                </div>
              </FormSection>
            ),
          },
          {
            id: "sections",
            label: "Sections",
            fields: ["tripTypesEyebrow", "tripTypesTitle", "tripTypesLead", "featuredEyebrow", "featuredTitle", "featuredLead", "destinationsEyebrow", "destinationsTitle", "routeMapEyebrow", "routeMapTitle", "routeMapLead", "reviewsEyebrow", "reviewsTitle"],
            content: (
              <div className="flex flex-col gap-6">
                {sectionFields("tripTypes", "Trip types")}
                {sectionFields("featured", "Featured packages")}
                {sectionFields("destinations", "Popular destinations", false)}
                {sectionFields("routeMap", "Map")}
                {sectionFields("reviews", "Customer reviews", false)}
              </div>
            ),
          },
          {
            id: "how",
            label: "How it works",
            fields: ["howEyebrow", "howTitle", "howLead", "steps"],
            content: (
              <div className="flex flex-col gap-6">
                {sectionFields("how", "How it works")}
                <Repeater
                  name="steps"
                  label="Steps"
                  description={`Three steps work best. ${TOKENS}`}
                  addLabel="Add step"
                  newItem={() => ({ title: "", text: "" })}
                  itemTitle={(item, i) => String(item.title || `Step ${i + 1}`)}
                  empty="No steps yet."
                >
                  {(path) => (
                    <>
                      <TextField name={path("title")} label="Title" />
                      <TextAreaField name={path("text")} label="Text" rows={3} />
                    </>
                  )}
                </Repeater>
              </div>
            ),
          },
          {
            id: "story",
            label: "Scroll story",
            fields: ["scenes"],
            content: (
              <Repeater
                name="scenes"
                label="Scroll story scenes"
                description="Full-screen scenes that change as the visitor scrolls. Each scene links to a destination."
                addLabel="Add scene"
                newItem={() => ({ destination: null, label: "", title: "", text: "" })}
                itemTitle={(item, i) => String(item.title || `Scene ${i + 1}`)}
                empty="No scenes yet."
              >
                {(path) => (
                  <>
                    <SelectField name={path("destination")} label="Destination" options={options.destinations} numeric />
                    <TextField name={path("label")} label="Small label" optional hint='e.g. "North". Defaults to the destination region.' />
                    <TextField name={path("title")} label="Title" />
                    <TextAreaField name={path("text")} label="Text" rows={2} />
                    <div className="md:col-span-2">
                      <ImageField name={path("image")} label="Photo" optional hint="Leave empty to use the destination's photo." />
                      <TextField name={path("imageLink")} label="Photo link" optional hint="Or paste a public image link. Used when no photo is uploaded." />
                    </div>
                  </>
                )}
              </Repeater>
            ),
          },
          {
            id: "callback",
            label: "Call-back",
            fields: ["callbackEyebrow", "callbackTitle", "callbackLead", "callbackCallNow"],
            content: (
              <FormSection columns={2}>
                <TextField name="callbackEyebrow" label="Small label" />
                <TextField name="callbackTitle" label="Title" />
                <div className="md:col-span-2">
                  <TextAreaField name="callbackLead" label="Intro line" rows={2} hint={TOKENS} />
                </div>
                <div className="md:col-span-2">
                  <TextField name="callbackCallNow" label="Line under the phone number" hint={TOKENS} />
                </div>
              </FormSection>
            ),
          },
        ]}
      />
    </RecordForm>
  );
}

/* ---------- About page ---------- */

export function AboutPageForm({ action, initial }: { action: Action; initial: object }) {
  return (
    <RecordForm action={action} initial={initial}>
      <FormTabs
        tabs={[
          {
            id: "top",
            label: "Top of page",
            fields: ["headerEyebrow", "headerTitle", "headerLead"],
            content: (
              <FormSection columns={2}>
                <TextField name="headerEyebrow" label="Small label above the title" />
                <TextField name="headerTitle" label="Title" />
                <div className="md:col-span-2">
                  <TextAreaField name="headerLead" label="Intro line" rows={2} />
                </div>
              </FormSection>
            ),
          },
          {
            id: "story",
            label: "Story",
            fields: ["storyTitle", "story"],
            content: (
              <FormSection>
                <TextField name="storyTitle" label="Story heading" />
                <TextAreaField name="story" label="Our story" hint="Leave an empty line between paragraphs." rows={10} />
              </FormSection>
            ),
          },
          {
            id: "facts",
            label: "Facts",
            fields: ["facts"],
            content: (
              <Repeater
                name="facts"
                label="Facts"
                description="Short facts shown in boxes, e.g. Founded: 2012."
                addLabel="Add fact"
                newItem={() => ({ label: "", value: "" })}
                itemTitle={(item, i) => String(item.label || `Fact ${i + 1}`)}
                empty="No facts yet."
              >
                {(path) => (
                  <>
                    <TextField name={path("label")} label="Label" />
                    <TextField name={path("value")} label="Value" />
                  </>
                )}
              </Repeater>
            ),
          },
          {
            id: "photos",
            label: "Photos",
            fields: ["teamPhoto", "teamPhotoAlt", "officePhoto", "officePhotoAlt"],
            content: (
              <FormSection columns={2}>
                <ImageField name="teamPhoto" label="Team photo (tall)" removable optional aspect="aspect-[3/4]" hint="Leave as is to keep the placeholder photo." />
                <TextField name="teamPhotoLink" label="Team photo link" optional hint="Or paste a public image link. Used when no photo is uploaded." />
                <ImageField name="officePhoto" label="Office photo (tall)" removable optional aspect="aspect-[3/4]" hint="Leave as is to keep the placeholder photo." />
                <TextField name="officePhotoLink" label="Office photo link" optional hint="Or paste a public image link. Used when no photo is uploaded." />
                <TextField name="teamPhotoAlt" label="Description of the team photo" />
                <TextField name="officePhotoAlt" label="Description of the office photo" />
              </FormSection>
            ),
          },
          {
            id: "values",
            label: "Values",
            fields: ["valuesTitle", "ctaTitle", "values"],
            content: (
              <div className="flex flex-col gap-6">
                <FormSection columns={2}>
                  <TextField name="valuesTitle" label="Values heading" />
                  <TextField name="ctaTitle" label="Closing call-to-action title" />
                </FormSection>
                <Repeater
                  name="values"
                  label="Values"
                  description="Four work best."
                  addLabel="Add value"
                  newItem={() => ({ title: "", text: "" })}
                  itemTitle={(item, i) => String(item.title || `Value ${i + 1}`)}
                  empty="No values yet."
                >
                  {(path) => (
                    <>
                      <TextField name={path("title")} label="Title" />
                      <TextAreaField name={path("text")} label="Text" rows={3} />
                    </>
                  )}
                </Repeater>
              </div>
            ),
          },
        ]}
      />
    </RecordForm>
  );
}

/* ---------- Other pages ---------- */

export function OtherPagesForm({ action, initial }: { action: Action; initial: object }) {
  const block = (prefix: string, title: string, fields: [string, string][]) => (
    <FormSection title={title} columns={2}>
      {fields.map(([name, label]) =>
        name.endsWith("Lead") || name.endsWith("Text") || name.endsWith("Steps") ? (
          <div key={name} className="md:col-span-2">
            <TextAreaField name={`${prefix}${name}`} label={label} rows={2} />
          </div>
        ) : (
          <TextField key={name} name={`${prefix}${name}`} label={label} />
        ),
      )}
    </FormSection>
  );
  return (
    <RecordForm action={action} initial={initial}>
      <FormTabs
        tabs={[
          {
            id: "packages",
            label: "Packages",
            fields: ["packagesEyebrow", "packagesTitle", "packagesLead", "packagesCtaTitle"],
            content: block("packages", "Packages page", [["Eyebrow", "Small label"], ["Title", "Title"], ["Lead", "Intro line"], ["CtaTitle", "Closing banner title"]]),
          },
          {
            id: "destinations",
            label: "Destinations",
            fields: ["destinationsEyebrow", "destinationsTitle", "destinationsLead", "destinationsCtaTitle", "destinationsCtaText"],
            content: block("destinations", "Destinations page", [["Eyebrow", "Small label"], ["Title", "Title"], ["Lead", "Intro line"], ["CtaTitle", "Closing banner title"], ["CtaText", "Closing banner text"]]),
          },
          {
            id: "plan",
            label: "Plan my trip",
            fields: ["planEyebrow", "planTitle", "planLead", "planNextTitle", "planNextSteps", "planTalkPrompt"],
            content: (
              <div className="flex flex-col gap-6">
                {block("plan", "Plan my trip page", [["Eyebrow", "Small label"], ["Title", "Title"], ["Lead", "Intro line"], ["NextTitle", "“What happens next” heading"], ["TalkPrompt", "Line above the phone number"]])}
                <FormSection title="What happens next" description={TOKENS}>
                  <LinesField name="planNextSteps" label="Points" rows={5} />
                </FormSection>
              </div>
            ),
          },
          {
            id: "contact",
            label: "Contact",
            fields: ["contactEyebrow", "contactTitle", "contactLead", "contactDirectTitle", "contactFormTitle", "contactFormLead", "contactMapTitle"],
            content: block("contact", "Contact page", [["Eyebrow", "Small label"], ["Title", "Title"], ["Lead", "Intro line"], ["DirectTitle", "Contact details heading"], ["FormTitle", "Form heading"], ["FormLead", "Line under the form heading"], ["MapTitle", "Map heading"]]),
          },
          {
            id: "thanks",
            label: "Thank you",
            fields: ["thankYouTitle", "thankYouText", "thankYouHurryTitle", "thankYouHurryText"],
            content: block("thankYou", "Thank you page", [["Title", "Title"], ["Text", "Text"], ["HurryTitle", "Second box heading"], ["HurryText", "Second box text"]]),
          },
          {
            id: "cta",
            label: "Closing banner",
            fields: ["enquiryCtaTitle", "enquiryCtaText"],
            content: block("enquiryCta", "Closing banner", [["Title", "Title"], ["Text", "Text"]]),
          },
        ]}
      />
    </RecordForm>
  );
}

/* ---------- Privacy and terms ---------- */

export function LegalPageForm({ action, initial }: { action: Action; initial: object }) {
  return (
    <RecordForm action={action} initial={initial}>
      <FormTabs
        tabs={[
          {
            id: "page",
            label: "Page",
            fields: ["title", "intro", "lastUpdated"],
            content: (
              <FormSection columns={2}>
                <TextField name="title" label="Page title" />
                <TextField name="lastUpdated" label="Last updated" placeholder="e.g. 12 November 2026" />
                <div className="md:col-span-2">
                  <TextAreaField name="intro" label="Intro line" rows={2} />
                </div>
              </FormSection>
            ),
          },
          {
            id: "review",
            label: "Legal review",
            fields: ["hideTemplateNotice"],
            content: (
              <FormSection>
                <SwitchField name="hideTemplateNotice" label="Reviewed by a legal adviser" hint="Until this is on, the website shows a “template text” warning on this page." />
              </FormSection>
            ),
          },
          {
            id: "sections",
            label: "Sections",
            fields: ["sections"],
            content: (
              <Repeater
                name="sections"
                label="Sections"
                description="Leave an empty line between paragraphs. Start a line with “- ” for a bullet. Type {email} or {phone} for the contact details. On the terms page, {cancellation-terms} on its own line shows the cancellation terms."
                addLabel="Add section"
                newItem={() => ({ heading: "", body: "" })}
                itemTitle={(item, i) => String(item.heading || `Section ${i + 1}`)}
                empty="No sections yet."
              >
                {(path) => (
                  <>
                    <TextField name={path("heading")} label="Heading" />
                    <div className="md:col-span-2">
                      <TextAreaField name={path("body")} label="Text" rows={8} />
                    </div>
                  </>
                )}
              </Repeater>
            ),
          },
        ]}
      />
    </RecordForm>
  );
}

/* ---------- Staff accounts ---------- */

export function UserForm({ action, initial, options, editing }: { action: Action; initial: object; options: Options; editing: boolean }) {
  return (
    <RecordForm action={action} initial={initial}>
      <FormSection title="Account" columns={2}>
        <TextField name="username" label="Username" />
        <TextField name="email" label="Email" type="email" />
        <TextField name="firstName" label="First name" optional />
        <TextField name="lastName" label="Last name" optional />
        <TextField name="password" type="password" label={editing ? "New password" : "Password"} optional={editing} hint={editing ? "Leave empty to keep the current password." : "At least 8 characters, not too common."} />
        <div className="flex flex-col gap-3">
          <SwitchField name="isActive" label="Can sign in" hint="Turn off to stop this person signing in without deleting the account." />
          <SwitchField name="isSuperuser" label="Administrator" hint="Administrators see everything and manage staff accounts." />
        </div>
        <div className="md:col-span-2">
          <CheckboxGroupField name="roles" label="Roles" options={options.roles} hint="A role decides which sections this person can see and change." />
        </div>
      </FormSection>
    </RecordForm>
  );
}

/* ---------- My account: change own password ---------- */

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, {});
  const [confirm, setConfirm] = useState("");
  const [next, setNext] = useState("");
  const mismatch = confirm.length > 0 && confirm !== next;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <FormError message={state.error ?? null} />
      <Field id="pw-current" label="Current password" error={state.fields?.currentPassword}>
        <input type="password" name="currentPassword" autoComplete="current-password" required className={inputClass} {...fieldAria("pw-current", state.fields?.currentPassword)} />
      </Field>
      <Field id="pw-new" label="New password" hint="At least 8 characters, not too common." error={state.fields?.newPassword}>
        <input type="password" name="newPassword" autoComplete="new-password" required onChange={(e) => setNext(e.target.value)} className={inputClass} {...fieldAria("pw-new", state.fields?.newPassword)} />
      </Field>
      <Field id="pw-confirm" label="Type the new password again" error={mismatch ? "The two passwords do not match." : undefined}>
        <input type="password" autoComplete="new-password" required onChange={(e) => setConfirm(e.target.value)} className={inputClass} {...fieldAria("pw-confirm", mismatch ? "x" : undefined)} />
      </Field>
      <div className="flex justify-end">
        <button type="submit" disabled={pending || mismatch} className={buttonClass("primary", "md", "min-w-40")}>
          {pending ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

/* ---------- Navigation and trip types ---------- */

export function NavLinkForm({ action, initial, cancelHref }: { action: Action; initial: object; cancelHref?: string }) {
  return (
    <RecordForm action={action} initial={initial} cancelHref={cancelHref}>
      <FormSection title="Link" description="Shown in the header and in the footer's Explore column." columns={2}>
        <TextField name="label" label="Link text" hint='e.g. "Packages"' />
        <TextField name="href" label="Page" hint='A page on this website, e.g. "/packages"' />
        <NumberField name="position" label="Order" hint="Lower numbers come first." />
        <SwitchField name="isPublished" label="Show on the website" />
      </FormSection>
    </RecordForm>
  );
}

export function TripTypeForm({ action, initial, cancelHref }: { action: Action; initial: object; cancelHref?: string }) {
  return (
    <RecordForm action={action} initial={initial} cancelHref={cancelHref}>
      <FormSection title="Trip type" description="The name and sentence shown on the home page, filters and forms.">
        <TextField name="label" label="Name" />
        <TextAreaField name="blurb" label="Sentence" optional rows={2} hint="One short line about who this trip type is for." />
      </FormSection>
    </RecordForm>
  );
}

export function PageSeoForm({ action, initial, cancelHref }: { action: Action; initial: object; cancelHref?: string }) {
  return (
    <RecordForm action={action} initial={initial} cancelHref={cancelHref}>
      <FormSection title="Search result" description="What search engines and link previews show for this page. Keep the title under about 60 characters.">
        <TextField name="title" label="Page title" />
        <TextAreaField name="description" label="Description" optional rows={3} hint="Under about 160 characters. Leave it short rather than long." />
      </FormSection>
    </RecordForm>
  );
}
