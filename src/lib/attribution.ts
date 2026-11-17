/**
 * Lead attribution for the enquiry forms: which campaign brought the visitor,
 * which site referred them, and which page the form was sent from.
 *
 * Campaign tags (utm_*) and the referrer are captured on the first page of a
 * visit and kept in sessionStorage, because the visitor usually browses a few
 * pages before enquiring. Nothing is stored beyond the browser tab's session.
 */

const KEY = "rb_attribution";

export interface Attribution {
  sourcePage: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}

type Landing = Omit<Attribution, "sourcePage">;

function read(): Landing | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Landing) : null;
  } catch {
    return null;
  }
}

/** Call on every page load; only the first page of the visit is recorded. */
export function captureLanding(): void {
  if (typeof window === "undefined" || read()) return;
  const params = new URLSearchParams(window.location.search);
  const external =
    document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : "";
  const landing: Landing = {
    referrer: external,
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(landing));
  } catch {
    // Private mode or storage disabled: attribution is optional.
  }
}

export function currentAttribution(): Attribution {
  const landing = read() ?? { referrer: "", utmSource: "", utmMedium: "", utmCampaign: "" };
  return { ...landing, sourcePage: window.location.pathname };
}
