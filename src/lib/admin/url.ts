/**
 * Build a dashboard list URL from the current query plus changes. Empty values
 * and defaults are dropped so URLs stay short and shareable; changing anything
 * but the page resets to page 1.
 */
export type Query = Record<string, string | undefined>;

export function withQuery(
  path: string,
  current: Query,
  changes: Record<string, string | number | null | undefined>,
  defaults: Query = {},
): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(current)) if (v) merged[k] = v;
  if (!("page" in changes)) delete merged.page;
  for (const [k, v] of Object.entries(changes)) {
    if (v === null || v === undefined || v === "") delete merged[k];
    else merged[k] = String(v);
  }
  for (const [k, v] of Object.entries(defaults)) if (merged[k] === v) delete merged[k];
  if (merged.page === "1") delete merged.page;
  const query = new URLSearchParams(merged).toString();
  return query ? `${path}?${query}` : path;
}

/** First value of each search param, as a plain object. */
export function flattenSearchParams(params: Record<string, string | string[] | undefined>): Query {
  return Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
}
