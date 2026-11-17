/**
 * Geometry for the hero map. Everything is derived from longitude and latitude,
 * so adding a stop is just adding a row to `stops`.
 * The outline is a deliberately simplified, faceted sketch of India for decoration only.
 */

export const MAP_WIDTH = 640;
export const MAP_HEIGHT = 700;

const LON_MIN = 67.5;
const LAT_MAX = 37.5;
const SX = 21;
const SY = 22.5;

type LonLat = [number, number];

function project([lon, lat]: LonLat): [number, number] {
  return [
    Math.round((lon - LON_MIN) * SX * 10) / 10,
    Math.round((LAT_MAX - lat) * SY * 10) / 10,
  ];
}

const outline: LonLat[] = [
  [73.9, 36.9], [75.4, 37.0], [77.0, 35.9], [78.9, 35.6], [80.3, 35.4], [79.9, 34.0],
  [79.2, 32.9], [78.8, 31.3], [79.9, 30.8], [81.0, 30.1], [80.2, 29.3], [80.1, 28.7],
  [81.6, 28.1], [83.3, 27.4], [84.7, 27.0], [86.0, 26.5], [88.1, 26.5], [88.1, 27.9],
  [88.8, 28.0], [88.9, 27.2], [89.8, 26.8], [91.6, 26.8], [92.1, 27.5], [93.5, 28.6],
  [95.0, 29.2], [96.2, 29.4], [97.3, 28.3], [97.0, 27.2], [95.9, 27.2], [95.2, 26.6],
  [94.7, 25.4], [94.6, 24.7], [93.4, 24.0], [93.3, 22.9], [92.6, 21.9], [92.3, 22.7],
  [92.2, 23.7], [91.6, 23.0], [91.2, 23.6], [91.3, 24.1], [92.2, 24.3], [92.4, 25.0],
  [90.4, 25.2], [89.8, 25.3], [89.8, 26.0], [88.9, 26.3], [88.1, 24.9], [88.7, 24.2],
  [88.8, 23.2], [89.0, 22.1], [88.9, 21.6], [87.8, 21.7], [87.0, 21.4], [86.8, 20.5],
  [85.9, 19.8], [85.0, 19.3], [84.1, 18.3], [83.2, 17.6], [82.3, 16.6], [81.3, 16.3],
  [80.9, 15.8], [80.1, 15.2], [80.1, 14.0], [80.3, 13.2], [80.2, 12.3], [79.8, 11.5],
  [79.8, 10.3], [79.0, 9.3], [78.2, 8.9], [77.55, 8.08], [76.9, 8.6], [76.3, 9.8],
  [75.8, 11.4], [75.1, 12.4], [74.6, 13.6], [74.2, 14.7], [73.8, 15.6], [73.3, 16.8],
  [73.0, 18.2], [72.8, 19.1], [72.7, 20.3], [72.9, 21.4], [72.6, 22.2], [72.2, 21.2],
  [71.1, 20.8], [70.3, 20.9], [69.2, 21.9], [69.0, 22.4], [70.2, 22.6], [70.3, 23.0],
  [69.2, 22.8], [68.4, 23.5], [68.2, 23.8], [68.8, 24.3], [70.0, 24.2], [71.0, 24.4],
  [70.7, 25.6], [70.1, 26.0], [69.5, 26.8], [70.2, 27.8], [71.9, 27.9], [72.9, 29.0],
  [73.4, 29.9], [74.5, 31.1], [74.6, 32.0], [75.3, 32.3], [74.4, 32.8], [74.0, 33.2],
  [73.6, 34.0], [73.4, 34.7], [72.6, 35.8], [72.6, 36.5],
];

export const outlinePath =
  outline.map((p, i) => `${i === 0 ? "M" : "L"}${project(p).join(",")}`).join(" ") + " Z";

/** Andaman and Nicobar, drawn as small dots. */
export const islands = (
  [
    [92.9, 13.2], [92.85, 12.4], [92.75, 11.7], [92.6, 10.7], [92.8, 9.2], [93.7, 7.4],
  ] as LonLat[]
).map(project);

interface Stop {
  name: string;
  at: LonLat;
  /** Which side of the pin the label sits on */
  side: "left" | "right";
}

/** Route order: north to south, then across the sea to the islands. */
const stopList: Stop[] = [
  { name: "Kashmir", at: [74.8, 34.1], side: "left" },
  { name: "Ladakh", at: [77.6, 34.15], side: "right" },
  { name: "Himachal", at: [77.2, 32.25], side: "right" },
  { name: "Delhi", at: [77.2, 28.6], side: "right" },
  { name: "Rajasthan", at: [75.3, 26.6], side: "left" },
  { name: "Goa", at: [73.9, 15.4], side: "left" },
  { name: "Kerala", at: [76.4, 10.0], side: "left" },
  { name: "Andaman", at: [92.75, 11.7], side: "left" },
];

const points = stopList.map((s) => project(s.at));

// Share of the total route length at which each stop sits (0 to 1), so pins can
// drop exactly as the drawn line reaches them.
const segmentLengths = points
  .slice(1)
  .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
const total = segmentLengths.reduce((a, b) => a + b, 0);
let walked = 0;

export const stops = stopList.map((s, i) => {
  if (i > 0) walked += segmentLengths[i - 1];
  return { name: s.name, side: s.side, x: points[i][0], y: points[i][1], progress: walked / total };
});

/** Smooth curve through every stop (Catmull-Rom converted to cubic Béziers). */
export const routePath = (() => {
  const p = points;
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const t = 0.18;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
})();
