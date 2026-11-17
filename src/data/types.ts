/** Trip type codes. Their labels and wording come from the backend (Trip types). */
export type TripType = "solo" | "couple" | "family" | "friends" | "corporate";

/** Package classifications. Their labels come from the backend (GET /api/v1/vocabulary/). */
export type Category = "hills" | "beach" | "heritage" | "adventure" | "pilgrimage" | "nature";

/** Trip-length filter bands; the day ranges come from the backend. */
export type DurationBand = "short" | "medium" | "long";

/** Budget bands. Labels come from the backend; the ranges are set in Site settings. */
export type BudgetBand = "value" | "comfort" | "premium";

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  /** e.g. "Breakfast, Dinner" */
  meals?: string;
  /** Where the night is spent */
  stay?: string;
}

export interface QuickFacts {
  startCity: string;
  endCity: string;
  bestSeason: string;
  stay: string;
  transport: string;
  groupSize: string;
}

/** The fields needed for a package card and for filtering. Content comes from the Django API. */
export interface PackageSummary {
  slug: string;
  name: string;
  /** Slug of the destination, or "" if none is set */
  destination: string;
  destinationName: string;
  days: number;
  nights: number;
  tripTypes: TripType[];
  category: Category;
  /** Human label for the category, e.g. "Hills and valleys". */
  categoryLabel: string;
  budget: BudgetBand;
  /** Per-person starting price in rupees. Null shows "₹[PRICE]". */
  priceFrom: number | null;
  featured: boolean;
  summary: string;
  /** Absolute image URL served by the backend */
  cover: string;
  coverAlt: string;
}

export interface TourPackage extends PackageSummary {
  overview: string;
  highlights: string[];
  quickFacts: QuickFacts;
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  /** The cover photo first, then the rest */
  gallery: { src: string; alt: string }[];
}

export interface Destination {
  slug: string;
  name: string;
  region: string;
  tagline: string;
  description: string;
  bestSeason: string;
  knownFor: string[];
  /** Absolute image URL served by the backend */
  image: string;
  popular: boolean;
  /** Number of published packages for this destination */
  packageCount: number;
}

export interface Review {
  id: string;
  text: string;
  name: string;
  trip: string;
}

export interface PhotoCredit {
  id: string;
  title: string;
  author: string;
  licence: string;
  source: string;
}

/** Agency details that the admin edits in the Django admin under "Site settings". */
export interface SiteSettings {
  tagline: string;
  description: string;
  phone: { display: string; href: string };
  whatsapp: { display: string; number: string };
  email: string;
  address: { display: string; locality: string; region: string; country: string; mapQuery: string };
  hours: string;
  callbackWindow: string;
  social: { instagram: string; facebook: string; youtube: string };
  cancellationTerms: string[];
  budgets: { id: BudgetBand; label: string; range: string }[];
}
