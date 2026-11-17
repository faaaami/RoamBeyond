"use client";

import type { FormState } from "@/lib/admin/actions";
import type { Options } from "@/lib/admin/api";
import { CheckboxGroupField, FormSection, FormTabs, ImageField, LinesField, NumberField, RecordForm, Repeater, SelectField, SwitchField, TextAreaField, TextField } from "../form";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/* ---------- Tour packages ---------- */

export function PackageForm({ action, initial, options, cancelHref }: { action: Action; initial: object; options: Options; cancelHref?: string }) {
  return (
    <RecordForm action={action} initial={initial} cancelHref={cancelHref}>
      <FormTabs
        tabs={[
          {
            id: "basics",
            label: "Basics",
            fields: ["name", "slug", "destination", "days", "nights", "priceFrom", "tripTypes", "category", "budget", "featured", "isPublished", "sortOrder"],
            content: (
              <FormSection columns={2}>
                <TextField name="name" label="Package name" />
                <TextField name="slug" label="Web address" hint="The last part of the page link, e.g. kerala-backwaters." />
                <SelectField name="destination" label="Destination" options={options.destinations} numeric />
                <div className="grid grid-cols-2 gap-4">
                  <NumberField name="days" label="Days" min={1} />
                  <NumberField name="nights" label="Nights" min={0} />
                </div>
                <NumberField name="priceFrom" label="Starting price per person (₹)" hint="Leave empty to show ₹[PRICE] on the website." optional nullable min={0} />
                <NumberField name="sortOrder" label="Sort order" hint="Lower numbers are shown first." optional min={0} />
                <div className="md:col-span-2">
                  <CheckboxGroupField name="tripTypes" label="Suitable for" options={options.tripTypes} />
                </div>
                <SelectField name="category" label="Category" options={options.categories} />
                <SelectField name="budget" label="Budget band" options={options.budgets} />
                <SwitchField name="isPublished" label="Published" hint="Turn off to hide the package from the website." />
                <SwitchField name="featured" label="Featured on the home page" />
              </FormSection>
            ),
          },
          {
            id: "description",
            label: "Description",
            fields: ["summary", "overview", "highlights"],
            content: (
              <FormSection>
                <TextAreaField name="summary" label="Short summary" hint="One sentence shown on the package card and in search results." rows={2} />
                <TextAreaField name="overview" label="Overview" rows={6} />
                <LinesField name="highlights" label="Highlights" />
              </FormSection>
            ),
          },
          {
            id: "facts",
            label: "Quick facts",
            fields: ["startCity", "endCity", "bestSeason", "groupSize", "stay", "transport"],
            content: (
              <FormSection columns={2}>
                <TextField name="startCity" label="Start city" optional />
                <TextField name="endCity" label="End city" optional />
                <TextField name="bestSeason" label="Best season" optional />
                <TextField name="groupSize" label="Group size" optional />
                <TextField name="stay" label="Stay" optional />
                <TextField name="transport" label="Transport" optional />
              </FormSection>
            ),
          },
          {
            id: "included",
            label: "Inclusions",
            fields: ["inclusions", "exclusions"],
            content: (
              <FormSection columns={2}>
                <LinesField name="inclusions" label="Included" />
                <LinesField name="exclusions" label="Not included" />
              </FormSection>
            ),
          },
          {
            id: "itinerary",
            label: "Itinerary",
            fields: ["itinerary"],
            content: (
              <Repeater
                name="itinerary"
                label="Day-wise itinerary"
                description="Drag a day with the arrows to reorder. Day numbers follow the order."
                addLabel="Add day"
                newItem={() => ({ title: "", description: "", meals: "", stay: "" })}
                itemTitle={(item, i) => String(item.title || `Day ${i + 1}`)}
                empty="No days yet. Add the first day of the trip."
              >
                {(path) => (
                  <>
                    <TextField name={path("title")} label="Title" />
                    <TextField name={path("stay")} label="Overnight stay" optional />
                    <div className="md:col-span-2">
                      <TextAreaField name={path("description")} label="What happens" rows={3} />
                    </div>
                    <TextField name={path("meals")} label="Meals" optional placeholder="e.g. Breakfast, Dinner" />
                  </>
                )}
              </Repeater>
            ),
          },
          {
            id: "photos",
            label: "Gallery",
            fields: ["photos"],
            content: (
              <Repeater
                name="photos"
                label="Gallery photos"
                description="Shown after the cover photo."
                addLabel="Add photo"
                newItem={() => ({ alt: "" })}
                itemTitle={(item, i) => String(item.alt || `Photo ${i + 1}`)}
                empty="No extra photos yet."
              >
                {(path) => (
                  <>
                    <ImageField name={path("image")} label="Photo" />
                    <TextField name={path("alt")} label="Description of the photo" />
                  </>
                )}
              </Repeater>
            ),
          },
          {
            id: "cover",
            label: "Cover photo",
            fields: ["cover", "coverAlt"],
            content: (
              <FormSection columns={2}>
                <ImageField name="cover" label="Cover photo" hint="Shown on the package card and first in the gallery." />
                <TextField name="coverAlt" label="Description of the cover photo" hint="For screen readers and search engines." />
              </FormSection>
            ),
          },
        ]}
      />
    </RecordForm>
  );
}

/* ---------- Destinations ---------- */

export function DestinationForm({ action, initial, cancelHref }: { action: Action; initial: object; cancelHref?: string }) {
  return (
    <RecordForm action={action} initial={initial} cancelHref={cancelHref}>
      <FormSection title="Destination" columns={2}>
        <TextField name="name" label="Name" />
        <TextField name="slug" label="Web address" hint="The last part of the page link, e.g. kerala." />
        <TextField name="region" label="Region" hint='e.g. "North India"' />
        <TextField name="tagline" label="Tagline" hint="One short line shown under the name." />
        <div className="md:col-span-2">
          <TextAreaField name="description" label="Description" rows={5} />
        </div>
        <TextField name="bestSeason" label="Best time to visit" optional />
        <LinesField name="knownFor" label="Known for" hint="One tag per line, e.g. Dal Lake houseboats." optional rows={4} />
        <div className="md:col-span-2">
          <ImageField name="image" label="Photo" />
        </div>
        <SwitchField name="isPublished" label="Published" hint="Turn off to hide the destination and its packages." />
        <SwitchField name="popular" label="Show as a popular destination" hint="Popular destinations appear on the home page and in the footer." />
        <NumberField name="sortOrder" label="Sort order" hint="Lower numbers are shown first." optional min={0} />
      </FormSection>
    </RecordForm>
  );
}

/* ---------- Reviews and photo credits ---------- */

export function ReviewForm({ action, initial, cancelHref }: { action: Action; initial: object; cancelHref?: string }) {
  return (
    <RecordForm action={action} initial={initial} cancelHref={cancelHref}>
      <FormSection title="Review" description="Only publish real reviews, with the customer's permission.">
        <TextAreaField name="text" label="Review" rows={5} />
        <div className="grid gap-5 md:grid-cols-2">
          <TextField name="name" label="Customer name" />
          <TextField name="trip" label="Trip" optional placeholder="e.g. Kashmir Valley Escape, March 2026" />
          <NumberField name="sortOrder" label="Sort order" optional min={0} />
        </div>
        <SwitchField name="isPublished" label="Published" hint="Turn off to hide this review from the website." />
      </FormSection>
    </RecordForm>
  );
}

export function PhotoCreditForm({ action, initial, cancelHref }: { action: Action; initial: object; cancelHref?: string }) {
  return (
    <RecordForm action={action} initial={initial} cancelHref={cancelHref}>
      <FormSection title="Credit" description="Shown on the /credits page. Delete a credit when its photo is replaced." columns={2}>
        <TextField name="title" label="Photo title" />
        <TextField name="author" label="Photographer" optional />
        <TextField name="licence" label="Licence" hint='e.g. "CC BY-SA 4.0"' />
        <TextField name="source" label="Source link" type="url" />
        <div className="md:col-span-2">
          <TextAreaField name="usedFor" label="Used for" optional rows={2} hint="A note for you on where the photo appears. Not shown on the website." />
        </div>
      </FormSection>
    </RecordForm>
  );
}
