/**
 * Shapes of the page wording the website reads from the backend (/api/v1/pages/*).
 * Generated from the wording the site used to ship with; keep in step with apps/pages/layout.py.
 */

export interface StoryScene {
  key: string;
  /** Destination slug the scene links to */
  slug: string;
  label: string;
  title: string;
  text: string;
  image: string;
}

export type HomeContent = {
  hero: {
    eyebrow: string;
    headlineLine1: string;
    headlineLine2: string;
    intro: string;
    primaryButton: string;
    secondaryButton: string;
    rotatingLabel: string;
  };
  tripTypes: {
    eyebrow: string;
    title: string;
    lead: string;
  };
  featured: {
    eyebrow: string;
    title: string;
    lead: string;
  };
  marquee: string[];
  destinations: {
    eyebrow: string;
    title: string;
    lead: string;
  };
  routeMap: {
    eyebrow: string;
    title: string;
    lead: string;
  };
  howItWorks: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: Array<{
      title: string;
      text: string;
    }>;
  };
  reviews: {
    eyebrow: string;
    title: string;
    lead: string;
  };
  callback: {
    eyebrow: string;
    title: string;
    lead: string;
    callNow: string;
  };
} & { scenes: StoryScene[] };

export type AboutContent = {
  header: {
    eyebrow: string;
    title: string;
    lead: string;
  };
  storyTitle: string;
  story: string;
  facts: Array<{
    label: string;
    value: string;
  }>;
  teamPhoto: {
    src: string;
    alt: string;
  };
  officePhoto: {
    src: string;
    alt: string;
  };
  valuesTitle: string;
  values: Array<{
    title: string;
    text: string;
  }>;
  ctaTitle: string;
};

export type PagesContent = {
  packages: {
    eyebrow: string;
    title: string;
    lead: string;
    ctaTitle: string;
  };
  destinations: {
    eyebrow: string;
    title: string;
    lead: string;
    ctaTitle: string;
    ctaText: string;
  };
  planTrip: {
    eyebrow: string;
    title: string;
    lead: string;
    nextTitle: string;
    nextSteps: string[];
    talkPrompt: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    lead: string;
    directTitle: string;
    formTitle: string;
    formLead: string;
    mapTitle: string;
  };
  thankYou: {
    title: string;
    text: string;
    hurryTitle: string;
    hurryText: string;
  };
  enquiryCta: {
    title: string;
    text: string;
  };
};

export type LegalContent = {
  title: string;
  intro: string;
  lastUpdated: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
} & { hideTemplateNotice: boolean };
