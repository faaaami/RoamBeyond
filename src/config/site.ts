/**
 * Details that are fixed in code. Everything an admin may want to change
 * (phone, WhatsApp, email, address, hours, policies) lives in the Django admin under
 * "Site settings" and is read with getSiteSettings() or useSite().
 */
export const siteConfig = {
  name: "RoamBeyond",
  shortName: "RoamBeyond",
  /** Public site URL, no trailing slash. Used for metadata, sitemap and JSON-LD. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com",

  /**
   * Optional landing-page hero video. Put a short, muted, looping clip in
   * /public/videos (MP4, ideally under 5 MB) and set its path here, e.g.
   * "/videos/hero.mp4". Leave empty to use the photo slideshow instead.
   */
  heroVideo: "",
} as const;
