# Travel agency website

A Next.js site for a Delhi-based travel agency. Visitors browse tour packages and send an enquiry; the agency calls them back. There is no online booking or payment. Packages, destinations, reviews, page text and agency details are managed in the admin panel (the `/admin` pages of this same site), which talks to the Django backend in `backend/`. The backend also receives and stores the enquiries.

**Stack:** Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Framer Motion, React Hook Form + Zod, lucide-react icons. Backend: Django + Django REST Framework, Postgres, Resend for email (see [backend/README.md](backend/README.md)).

## Run it

Requires Node.js 20.9 or newer and the backend running (see [backend/README.md](backend/README.md)).

```bash
# terminal 1: the backend on http://localhost:8000
cd backend && make install && make migrate && make superuser && make run

# terminal 2: the website on http://localhost:3000
npm install
cp .env.example .env.local   # the defaults work for local development
npm run dev
```

A fresh backend database is empty. Sign in at http://localhost:3000/admin and add content there, or copy it from an existing Sanity project once with `python manage.py import_sanity --project-id <id>` (see the backend README).

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build. The backend must be reachable: every published package and destination is generated as static HTML |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Content (admin panel)

Editors work in the admin panel at http://localhost:3000/admin. Only staff accounts can get in; anyone else who visits `/admin` is sent to the public site. To create an administrator: `cd backend && .venv/bin/python manage.py createsuperuser`. Changes appear on the website on the next page load after **Save**: the backend tells the site to refresh its cache. No redeploy is needed.

| In the admin | What it controls |
| --- | --- |
| **Catalog > Tour packages** | Name, destination, days, price, trip types, summary, itinerary, inclusions, photos, whether it is featured on the home page, and whether it is published |
| **Catalog > Destinations** | Name, region, description, photo, and whether it is shown as popular |
| **Catalog > Reviews** | The reviews on the home page. The section is hidden when there are none |
| **Catalog > Photo credits** | The list on the `/credits` page |
| **Website pages > Home page** | Hero headline and buttons, the scroll story scenes, the moving strip of place names, section headings, the "How it works" steps and the call-back section |
| **Website pages > About page** | Headings, the story, the facts, the two photos and the values |
| **Website pages > Other pages** | Headings and short texts on the Packages, Destinations, Plan my trip, Contact and Thank you pages, and the closing banner |
| **Website pages > Legal pages** | The privacy policy and the terms, section by section |
| **Website pages > Site settings** | Phone, WhatsApp, email, address, opening hours, call-back time, footer description, budget ranges and cancellation terms |
| **Enquiries** | Every form submission, with its status (new, contacted, converted, closed) |

Give each editor a staff account with only the permissions they need (Authentication > Users).

Lists such as highlights, inclusions or cancellation terms are typed one item per line. Untick **Published** on a package, destination or review to hide it from the site without deleting it.

Placeholders: in most text fields the admin can type `{callback-time}`, `{phone}`, `{email}` or `{hours}` and the site inserts the value from Site settings, so a phone number is only ever typed once. In the legal pages, a line starting with `- ` becomes a bullet, and `{cancellation-terms}` on its own line shows the cancellation terms.

If a field is left empty, the site shows the original wording from `src/content/defaults.ts` instead of a blank.

Still in code: the agency name and site URL (`src/config/site.ts`), the logo, the menu links, the lists of trip types, categories and durations (`src/data/types.ts`), form labels and error messages, button labels inside cards, and each page's search-engine description.

How it is wired: every page reads through the functions in `src/lib/content.ts`, which call the backend's read-only API (`/api/v1/...`) and cache the result under one tag. After an admin save the backend calls `src/app/api/revalidate/route.ts`, which clears that cache. Client components get the site settings from `useSite()`.

## Before you go live

1. **Site settings** in the admin: replace every `[BRACKETED]` value. The phone "number to dial" and the WhatsApp number need real digits for the call and WhatsApp buttons to work.
2. **Prices**: set the starting price on each package.
3. **Reviews**: replace the three placeholder reviews with real ones, or delete them.
4. **About page**: replace the bracketed story and facts and upload the two photos.
5. **Privacy policy and Terms**: the text is a template. Have it reviewed, replace the bracketed values, set "Last updated", then tick "Hide the template text warning".
6. **Photos**: replace package and destination photos (see "Images").
7. **`NEXT_PUBLIC_SITE_URL`**: your real domain, used for SEO tags and the sitemap.
8. **Agency name**: `name` in `src/config/site.ts`.

## Add or edit a package

1. In the admin, open **Catalog > Tour packages** and click **Add tour package** (or open an existing one).
2. Fill in the sections: Basics, Description, Quick facts, Inclusions and Cover photo, then the day-wise itinerary and any extra photos at the bottom. The web address fills itself in from the name.
3. Pick the destination. Create it first under **Destinations** if it is new.
4. Leave the price empty to show `₹[PRICE]`.
5. Click **Save**.

The listing, filters, destination page, related packages, sitemap and JSON-LD all pick the new package up automatically.

## Images

Package, destination, scene and About photos are uploaded in the admin and served by the backend (from `/media/`, or from an S3-compatible bucket in production; see the backend README). Landscape photos around 1600 px wide work well; `next/image` resizes and compresses them.

The photos the site started with come from Wikimedia Commons under Creative Commons and Free Art licences, which require credit. The credits are listed under **Photo credits** in the admin and shown on the `/credits` page (linked in the footer). When you replace a Wikimedia photo with your own, delete its credit.

A few pictures are still files in `public/images`, because they belong to the page design, not to a package or destination:

| File name | Used for |
| --- | --- |
| `about-team.jpg`, `about-office.jpg` | About page placeholders, shown until photos are uploaded in the admin |
| `og-default.jpg` (1200 x 630) | Link preview when the site is shared |

The other files in `public/images` are the original photos, kept as a record. The site no longer reads them.

## Enquiry forms

All three forms (package enquiry, custom trip request, call-back/contact) are validated in the browser with Zod (`src/lib/enquiry-schema.ts`) and posted to the backend at `POST /api/v1/enquiries/` (`src/lib/use-enquiry-submit.ts`). The backend validates them again, stores the lead, emails the agency through [Resend](https://resend.com) and rate-limits submissions. Email setup is in the backend README.

Every form also has a **Send on WhatsApp** button that opens `wa.me` with the typed details pre-filled, using the WhatsApp number from Site settings.

## Deploy

The site and the backend deploy separately. Deploy the backend first (see the backend README), then the site, for example on Vercel:

1. Push the project to a GitHub, GitLab or Bitbucket repository.
2. At <https://vercel.com/new>, import the repository. Vercel detects Next.js; keep the default settings.
3. Under **Environment Variables**, add `NEXT_PUBLIC_API_URL` (the backend's public URL), `NEXT_PUBLIC_SITE_URL` and `REVALIDATE_SECRET` (a long random string). Add `MEDIA_HOST_URL` if the backend serves photos from a bucket domain.
4. Click **Deploy**.
5. Add your domain under Project, Settings, Domains, then make sure `NEXT_PUBLIC_SITE_URL` matches it and redeploy.
6. On the backend, set `CORS_ALLOWED_ORIGINS` to the site's domain, `FRONTEND_REVALIDATE_URL` to `https://<your-domain>/api/revalidate` and `FRONTEND_REVALIDATE_SECRET` to the same value as `REVALIDATE_SECRET`.

Or from the terminal: `npx vercel`, then `npx vercel --prod`.

## Project structure

```
src/
  app/                     Routes (App Router)
    (site)/                Public pages, wrapped in the header and footer
      page.tsx             Landing page
      packages/            Listing and /packages/[slug] details
      destinations/        All destinations and /destinations/[slug]
      plan-my-trip/        Custom trip request form
      about/ contact/ thank-you/ privacy/ terms/ credits/
    api/revalidate/        Called by the backend after an admin edit to refresh the cache
    sitemap.ts robots.ts not-found.tsx
  components/
    Header, Footer, PackageCard, FilterPanel, PackageListing, ItineraryDay,
    Gallery, SectionReveal, WhatsAppButton, DestinationTile, PageHeader ...
    SiteShell, SiteProvider  Site frame, and site settings for client components
    hero/                  Hero and HeroScene (illustrated, animated), HeroMap (animated SVG), QuickSearch
    home/                  TripTypes, ScrollStory, RouteMap, HowItWorks, Marquee, Reviews, ScrollProgress
    forms/                 EnquiryForm, PlanTripForm, CallbackForm
    ui/                    Button styles, Field, Tag
  config/site.ts           Agency name, site URL, and fallbacks for empty settings
  content/defaults.ts      Original page wording, used when an admin field is empty
  data/types.ts            Shared types and the fixed lists (trip types, categories, durations)
  lib/
    content.ts             Reads content from the backend API (what pages call)
    api.ts                 Backend URL for the browser forms
    ...                    Zod schemas, filters, WhatsApp links, SEO
scripts/
  generate-placeholders.mjs  Labelled placeholder photos for public/images
backend/                   Django API and admin (its own README)
public/images/             Hero, About and link-preview photos
```

## Hero

The landing-page hero has no photos. It is a generated, animated scene in the brand greens: a night sky with stars, a detailed moon, a flight route with a plane, and layered mountains with snow, moonlit and shadowed faces and forested ridges, all of which shift with the cursor and with scroll. The scene is in `src/components/hero/HeroScene.tsx` and the mountain shapes are generated in `src/components/hero/scene-geometry.ts` (change a `seed` there for a different skyline); the headline, buttons and floating destination chips are in `src/components/hero/Hero.tsx`. The destination names come from the backend. Visitors who prefer reduced motion see the same scene, still.

To use a real video instead, put a short muted clip at `public/videos/hero.mp4` (MP4, ideally under 5 MB and 10 to 20 seconds long) and set `heroVideo: "/videos/hero.mp4"` in `src/config/site.ts`. It autoplays muted on a loop in place of the illustrated scene.

## Design tokens

The palette is green, cream and white, defined once in `src/app/globals.css` under `@theme`: green `#1F5A3D`, deep green `#12291E` (text and footer), cream `#F4ECD8`, light cream page background `#FCF9F1`, with white cards. Change them there to re-skin the site. Buttons are green on light backgrounds (`primary`) and cream on green or photo backgrounds (`cream`); see `src/components/ui/button.ts`. Headings use Bricolage Grotesque and body text uses DM Sans, both loaded with `next/font` in `src/app/layout.tsx`.

## Motion reference

Only `transform` and `opacity` are animated (plus SVG `pathLength` for the two drawn lines). With "reduce motion" switched on in the operating system, everything appears in its final state with no movement.

| Animation | Where | Trigger | Timing |
| --- | --- | --- | --- |
| Headline word reveal | `hero/Hero.tsx` | Page load | 0.7s per word, 70ms apart, ease `[0.22, 1, 0.36, 1]` |
| Hero slideshow | `hero/Hero.tsx` | Automatic | Each photo shows for 6.5s, crossfades over 1.4s and zooms slowly from 1.04 to 1.16 |
| Route line draws | `hero/HeroMap.tsx` (in `home/RouteMap.tsx`) | Map scrolls into view, once | `pathLength` 0 to 1, 3.2s easeInOut, 0.7s delay |
| Pins drop in | `hero/HeroMap.tsx` | As the route reaches each pin | Spring, stiffness 420, damping 16 |
| Hero parallax | `hero/Hero.tsx` | Scroll (first 700px) | Photo drifts down 90px; headline lifts 60px and fades |
| Scroll story | `home/ScrollStory.tsx` | Scroll through the pinned section | Full-screen photos crossfade, each scaling 1.18 to 1; text rises 48px |
| Scroll progress bar | `home/ScrollProgress.tsx` | Page scroll | `scaleX` with a spring (stiffness 140, damping 28) |
| Section fade and slide | `SectionReveal.tsx` | 15% in view, once | 0.6s, 28px rise |
| Card stagger | `SectionReveal.tsx` (`StaggerGroup`) | 10% in view, once | 80ms between items |
| Destination tiles scale | `StaggerItem effect="scale"` | In view, once | 0.94 to 1, 0.6s |
| Steps line draws | `home/HowItWorks.tsx` | Scroll through the section | `useScroll` mapped to `pathLength` |
| Place-name marquee | `home/Marquee.tsx` | Always (pauses on hover) | CSS, 48s linear loop |
| Card hover | `PackageCard.tsx` | Hover or focus | Lift 6px, photo zoom 1.06, 0.3 to 0.5s |
| Button press | `ui/button.ts` | Press | Scale 0.97, 150ms |

## Notes

- **Unknown package or destination URLs** show the 404 page with a `noindex` tag. Because the route streams behind a loading skeleton, the HTTP status for those is 200 rather than 404.
- **The map of India** on the landing page is a simplified decorative sketch generated from coordinates in `src/components/hero/india-map.ts`. Edit the `stops` list there to change the route.

## Deployment settings

**Website (Vercel).** Environment variables are read when the site is built, so change them, then redeploy.

| Variable | Type in Vercel | Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Config | The API address, e.g. `https://<api>.onrender.com` |
| `NEXT_PUBLIC_SITE_URL` | Config | The website address, e.g. `https://<site>.vercel.app` |
| `API_URL` | Secret | The API address, used while pages are built |
| `REVALIDATE_SECRET` | Secret | Must equal `FRONTEND_REVALIDATE_SECRET` on the API |

`NEXT_PUBLIC_` variables go into the browser, so they can't be Secret.

**API (Render).** Set the website address in `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `FRONTEND_URL`, `ADMIN_PANEL_URL` (address + `/admin`), and `FRONTEND_REVALIDATE_URL` (address + `/api/revalidate`). Redeploy the API after changing them.
