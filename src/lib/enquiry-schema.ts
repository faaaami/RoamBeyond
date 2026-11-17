import { z } from "zod";

/** Client-side validation for the enquiry forms. The Django API (backend/apps/enquiries/serializers.py) mirrors these rules and messages. */

const tripTypeIds = ["solo", "couple", "family", "friends", "corporate"] as const;

const name = z
  .string()
  .trim()
  .min(2, "Please enter your full name")
  .max(80, "Name is too long");

/** Indian mobile: 10 digits starting 6 to 9, with optional +91 / 91 / 0 prefix and spaces or dashes. */
const mobile = z
  .string()
  .trim()
  .regex(
    /^(?:(?:\+91|91)[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/,
    "Enter a valid 10-digit Indian mobile number",
  );

const email = z.union([z.literal(""), z.email("Enter a valid email address")]);

const travelDate = z.union([
  z.literal(""),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date"),
]);

const consent = z.boolean().refine((v) => v === true, {
  message: "Please tick the box so we can contact you",
});

/** Honeypot: real visitors never see or fill this field. */
const website = z.string().max(200).optional();

const travellers = {
  adults: z
    .number({ error: "Enter the number of adults" })
    .int("Whole numbers only")
    .min(1, "At least 1 adult")
    .max(200, "For groups above 200, please call us"),
  children: z
    .number({ error: "Enter 0 if no children are travelling" })
    .int("Whole numbers only")
    .min(0, "Cannot be negative")
    .max(100, "Please call us for large groups"),
};

const tripType = z.enum(tripTypeIds, { error: "Choose a trip type" });
const message = z.string().trim().max(1500, "Please keep this under 1500 characters");

export const callbackSchema = z.object({
  kind: z.literal("callback"),
  name,
  mobile,
  /** Only shown on the contact page version of the form. */
  message: message.optional(),
  consent,
  website,
});

export const packageEnquirySchema = z.object({
  kind: z.literal("package"),
  packageName: z.string().trim().min(1).max(120),
  packageSlug: z.string().trim().max(120),
  name,
  mobile,
  email,
  travelDate,
  tripType,
  ...travellers,
  message,
  consent,
  website,
});

export const customTripSchema = z.object({
  kind: z.literal("custom"),
  name,
  mobile,
  email,
  departureCity: z.string().trim().max(80, "City name is too long"),
  destination: z
    .string()
    .trim()
    .min(2, "Tell us where you would like to go")
    .max(120, "Please shorten this"),
  travelDate,
  duration: z.string().trim().max(40),
  budget: z.string().trim().max(40),
  tripType,
  ...travellers,
  message,
  consent,
  website,
});

export const enquirySchema = z.discriminatedUnion("kind", [
  callbackSchema,
  packageEnquirySchema,
  customTripSchema,
]);

export type CallbackInput = z.infer<typeof callbackSchema>;
export type PackageEnquiryInput = z.infer<typeof packageEnquirySchema>;
export type CustomTripInput = z.infer<typeof customTripSchema>;
export type Enquiry = z.infer<typeof enquirySchema>;

const tripTypeLabels: Record<(typeof tripTypeIds)[number], string> = {
  solo: "Solo",
  couple: "Couple",
  family: "Family",
  friends: "Friends group",
  corporate: "Corporate",
};

/** Label and value pairs used for both the email body and the WhatsApp message. */
export function enquiryLines(data: Partial<Enquiry> & { kind: Enquiry["kind"] }): [string, string][] {
  const d = data as Record<string, unknown>;
  const text = (key: string) => (typeof d[key] === "string" ? (d[key] as string).trim() : "");
  const num = (key: string) =>
    typeof d[key] === "number" && Number.isFinite(d[key]) ? String(d[key]) : "";
  const type = text("tripType") as keyof typeof tripTypeLabels | "";

  const lines: [string, string][] = [
    ["Package", text("packageName")],
    ["Name", text("name")],
    ["Mobile", text("mobile")],
    ["Email", text("email")],
    ["Travelling from", text("departureCity")],
    ["Destination", text("destination")],
    ["Travel date", text("travelDate")],
    ["Duration", text("duration")],
    ["Budget", text("budget")],
    ["Trip type", type ? tripTypeLabels[type] : ""],
    ["Adults", num("adults")],
    ["Children", num("children")],
    ["Message", text("message")],
  ];
  return lines.filter(([, value]) => value !== "");
}

export const enquiryTitles: Record<Enquiry["kind"], string> = {
  callback: "Call-back request",
  package: "Package enquiry",
  custom: "Custom trip request",
};
