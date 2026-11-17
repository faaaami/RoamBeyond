/**
 * Generates labelled placeholder photos in /public/images.
 * Run with: node scripts/generate-placeholders.mjs
 * Existing files are never overwritten (pass --force to regenerate everything),
 * so real photos you have added are safe.
 */
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(process.cwd(), "public", "images");

// [sky top, sky bottom, far layer, mid layer, near layer, sun]
const palettes = {
  kashmir: ["#9CC9D8", "#E6F0EC", "#7FA7B5", "#3F7C74", "#0B4F4A", "#FFFFFF"],
  kerala: ["#BFE3D0", "#F2F5DC", "#6DB08A", "#2E8062", "#0B4F4A", "#F5B301"],
  rajasthan: ["#F6C98A", "#FBE9CF", "#E0A064", "#C4703E", "#7A3B1E", "#FFF3D6"],
  ladakh: ["#5FA3D6", "#D6E8F2", "#B9A88F", "#8C7458", "#4B4034", "#FFFFFF"],
  himachal: ["#A9D0E8", "#EEF4F0", "#86AFA0", "#3D7A5F", "#17493C", "#FFF6D8"],
  goa: ["#F7B27A", "#FCE6C4", "#F08A5D", "#2C8C99", "#0B4F4A", "#FFF1C9"],
  uttarakhand: ["#B6C8E6", "#F1EEE6", "#8FA3C2", "#5B7392", "#263E58", "#F5B301"],
  andaman: ["#7FD3D6", "#E9F8F1", "#3FB7BF", "#1E8E99", "#0E5560", "#FFFFFF"],
  golden: ["#F3C5A0", "#FBEFE2", "#D99A78", "#B56A4E", "#6E3626", "#FFF6E4"],
  brand: ["#1F5A3D", "#2B7350", "#27694A", "#1A4D34", "#12291E", "#F4ECD8"],
};

const files = [];
const add = (name, palette, seed) => files.push({ name, palette, seed });

const pkgPalettes = {
  "kashmir-valley-escape": "kashmir",
  "kerala-backwaters-and-hills": "kerala",
  "royal-rajasthan-circuit": "rajasthan",
  "ladakh-road-adventure": "ladakh",
  "himachal-hill-stations": "himachal",
  "goa-beach-break": "goa",
  "char-dham-yatra": "uttarakhand",
  "andaman-island-hopping": "andaman",
  "golden-triangle-weekend": "golden",
};
Object.entries(pkgPalettes).forEach(([slug, pal], i) => {
  ["cover", "1", "2", "3"].forEach((suffix, j) => add(`${slug}-${suffix}`, pal, i * 7 + j * 3 + 1));
});

const destPalettes = {
  kashmir: "kashmir",
  kerala: "kerala",
  rajasthan: "rajasthan",
  ladakh: "ladakh",
  "himachal-pradesh": "himachal",
  goa: "goa",
  uttarakhand: "uttarakhand",
  andaman: "andaman",
  "golden-triangle": "golden",
};
Object.entries(destPalettes).forEach(([slug, pal], i) => add(`destination-${slug}`, pal, i * 5 + 40));

add("about-team", "brand", 91);
add("about-office", "brand", 97);
add("og-default", "brand", 101);

// Small deterministic random so regenerating gives the same pictures.
function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function ridge(rand, w, h, baseY, amp, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const x = (w / steps) * i;
    const y = baseY - rand() * amp;
    pts.push(`${x.toFixed(0)},${y.toFixed(0)}`);
  }
  return `M0,${h} L${pts.join(" L")} L${w},${h} Z`;
}

function svg({ name, palette, seed }, w, h) {
  const [skyTop, skyBottom, far, mid, near, sun] = palettes[palette];
  const rand = rng(seed);
  const sunX = w * (0.2 + rand() * 0.6);
  const sunY = h * (0.2 + rand() * 0.18);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <circle cx="${sunX}" cy="${sunY}" r="${h * 0.075}" fill="${sun}" opacity="0.9"/>
  <path d="${ridge(rand, w, h, h * 0.62, h * 0.26, 9)}" fill="${far}"/>
  <path d="${ridge(rand, w, h, h * 0.76, h * 0.2, 7)}" fill="${mid}"/>
  <path d="${ridge(rand, w, h, h * 0.9, h * 0.14, 6)}" fill="${near}"/>
  <text x="${w / 2}" y="${h - 28}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(w / 52)}" fill="#FFFFFF" opacity="0.85">Placeholder photo: ${name}.jpg</text>
</svg>`;
}

await mkdir(OUT, { recursive: true });
const force = process.argv.includes("--force");
let written = 0;
for (const file of files) {
  if (!force && existsSync(path.join(OUT, `${file.name}.jpg`))) continue;
  written++;
  const isOg = file.name === "og-default";
  const [w, h] = isOg ? [1200, 630] : [1600, 1067];
  await sharp(Buffer.from(svg(file, w, h)))
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(OUT, `${file.name}.jpg`));
}
console.log(`Wrote ${written} placeholder images to public/images (${files.length - written} existing files kept)`);
