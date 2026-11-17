/**
 * Procedural shapes for the hero scene: mountain ridgelines, their shadowed
 * faces, tree lines and stars. Everything is generated from fixed seeds, so the
 * server and the browser always draw exactly the same picture.
 */

export const SCENE_W = 1440;
export const SCENE_H = 560;
const X0 = -90;
const X1 = SCENE_W + 90;
const FLOOR = SCENE_H + 60;

type Point = [number, number];

export function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Smooth 1D noise between 0 and 1. */
function makeNoise(seed: number) {
  const r = seeded(seed);
  const lattice = Array.from({ length: 512 }, () => r());
  return (x: number) => {
    const i = Math.floor(x);
    const f = x - i;
    const a = lattice[((i % 512) + 512) % 512];
    const b = lattice[(((i + 1) % 512) + 512) % 512];
    return a + (b - a) * f * f * (3 - 2 * f);
  };
}

interface RidgeOptions {
  seed: number;
  /** y of the valley floor, and how far the highest peaks rise above it */
  base: number;
  amp: number;
  /** Distance between major peaks, in px */
  wavelength: number;
  octaves: number;
  /** Ridged noise gives sharp alpine peaks; plain noise gives rolling hills. */
  ridged: boolean;
  step?: number;
}

/** A fractal skyline, left to right. */
function ridgeline({ seed, base, amp, wavelength, octaves, ridged, step = 6 }: RidgeOptions): Point[] {
  const noise = makeNoise(seed);
  const points: Point[] = [];
  for (let x = X0; x <= X1; x += step) {
    let height = 0;
    let weight = 1;
    let frequency = 1 / wavelength;
    let total = 0;
    for (let o = 0; o < octaves; o++) {
      let v = noise(x * frequency + o * 37.1);
      if (ridged) {
        v = 1 - Math.abs(2 * v - 1);
        v *= v;
      }
      height += v * weight;
      total += weight;
      weight *= 0.5;
      frequency *= 2.1;
    }
    points.push([x, base - amp * (height / total)]);
  }
  return points;
}

const fmt = (n: number) => n.toFixed(1);
const line = (points: Point[]) => points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join(" L");

/** The filled silhouette under a ridgeline. */
function silhouette(points: Point[]): string {
  return `M${X0} ${FLOOR} L${line(points)} L${X1} ${FLOOR} Z`;
}

interface AlpineOptions {
  seed: number;
  /** Number of summits across the scene */
  count: number;
  /** y of the highest and lowest summits (smaller y is higher on screen) */
  high: number;
  low: number;
  /** y of the valley floor */
  base: number;
  /** Above this line a summit carries snow. Use 0 for none. */
  snowLine: number;
  /** How much lower the summits on the left are, in px. The headline sits there. */
  leftDrop: number;
}

/** How far a spur leans left for every pixel it drops: the moon is to the upper right. */
const LEAN = 0.32;

/**
 * An alpine range built from individual summits, each a cone with its own
 * slopes. Returns the skyline plus the pieces that make it read as rock:
 * the faces in shadow, the snow caps and the gullies on the lit faces.
 */
function alpineRange({ seed, count, high, low, base, snowLine, leftDrop }: AlpineOptions) {
  const r = seeded(seed);
  const rough = makeNoise(seed + 1);
  const span = (X1 - X0) / count;
  const summits = Array.from({ length: count }, (_, i) => {
    const tall = r() < 0.4;
    const x = X0 + span * (i + 0.5) + (r() - 0.5) * span * 0.7;
    const y = tall ? high + r() * (low - high) * 0.35 : high + (0.45 + r() * 0.55) * (low - high);
    // Summits get lower towards the left, leaving the sky clear behind the headline.
    const sink = Math.max(0, 0.64 - (x - X0) / (X1 - X0)) * 2 * leftDrop;
    return {
      x,
      y: Math.min(y + sink, base - 30),
      left: 0.75 + r() * 0.55,
      right: 0.7 + r() * 0.6,
    };
  });

  // Skyline: the highest cone at each x, with a little fractal roughness.
  const step = 4;
  const points: Point[] = [];
  const owner: number[] = [];
  for (let x = X0; x <= X1; x += step) {
    let best = base;
    let who = -1;
    summits.forEach((m, i) => {
      const y = m.y + (x < m.x ? m.left : m.right) * Math.abs(x - m.x);
      if (y < best) {
        best = y;
        who = i;
      }
    });
    const jitter = (rough(x * 0.045) - 0.5) * 16 + (rough(x * 0.16 + 9) - 0.5) * 7;
    points.push([x, best + jitter]);
    owner.push(who);
  }

  const shadows: string[] = [];
  const snow: string[] = [];
  const gullies: string[] = [];

  summits.forEach((m, i) => {
    const first = owner.indexOf(i);
    const last = owner.lastIndexOf(i);
    const top = Math.round((m.x - X0) / step);
    // Skip summits hidden behind their neighbours.
    if (first === -1 || top <= first || top >= last) return;
    const [tx, ty] = points[top];

    // The spur: a zigzag ridge running down from the summit towards the viewer.
    const spurX = (y: number, k: number) => {
      const drop = y - ty;
      return (
        tx -
        drop * LEAN +
        (k % 2 ? 1 : -1) * Math.min(1.5 + drop * 0.02, 5) +
        (rough(y * 0.035 + i * 7.3) - 0.5) * Math.min(drop * 0.5, 30)
      );
    };
    const spur: Point[] = [];
    for (let y = ty + 9, k = 0; y < FLOOR; y += 9 + (k % 3) * 3, k++) spur.push([spurX(y, k), y]);

    const [vx, vy] = points[first];
    shadows.push(
      `M${line(points.slice(first, top + 1))} L${line(spur)} L${fmt(vx - (FLOOR - vy) * LEAN)} ${FLOOR} Z`,
    );

    // Gullies: thin dark lines down the moonlit face, parallel to the spur.
    for (let g = 1; g <= 3; g++) {
      const at = top + Math.round(((last - top) * g) / 4.2 + r() * 3);
      if (at >= last) break;
      const [gx, gy] = points[at];
      const length = 50 + r() * 110;
      gullies.push(
        `M${fmt(gx - 4)} ${fmt(gy + 8)} l${fmt(-length * LEAN * 0.5 + 5)} ${fmt(length * 0.5)} l${fmt(-length * LEAN * 0.5 - 4)} ${fmt(length * 0.5)}`,
      );
    }

    // Snow cap, with a ragged lower edge that reaches furthest along the spur.
    const depth = snowLine - ty;
    if (snowLine > 0 && depth > 14) {
      let l = top;
      while (l > first && points[l][1] < ty + depth * 0.8) l--;
      let rr = top;
      while (rr < last && points[rr][1] < ty + depth) rr++;
      const [rx, ry] = points[rr];
      const [lx, ly] = points[l];
      const teeth = Math.max(4, Math.round((rx - lx) / 17));
      const edge: Point[] = [];
      for (let k = 1; k < teeth; k++) {
        const t = k / teeth;
        const x = rx + (lx - rx) * t;
        const nearSpur = 1 - Math.min(1, Math.abs(x - (tx - depth * LEAN)) / (rx - lx));
        const reach = (0.1 + 0.45 * nearSpur) * (0.5 + r());
        const y = ry + (ly - ry) * t + (k % 2 ? depth * reach : -depth * 0.16 * r()) + (r() - 0.5) * 6;
        edge.push([x, y]);
      }
      snow.push(`M${line(points.slice(l, rr + 1))} L${line(edge)} Z`);
    }
  });

  return {
    shape: silhouette(points),
    shadow: shadows.join(" "),
    snow: snow.join(" "),
    gullies: gullies.join(" "),
  };
}

/** Conifers standing along a ridge, as one path. */
function treeLine(points: Point[], seed: number, minHeight: number, maxHeight: number): string {
  const r = seeded(seed);
  const heightAt = (x: number) => {
    const t = (x - X0) / (points[1][0] - points[0][0]);
    const i = Math.max(0, Math.min(points.length - 2, Math.floor(t)));
    const f = t - i;
    return points[i][1] + (points[i + 1][1] - points[i][1]) * f;
  };
  const trees: string[] = [];
  for (let x = X0; x < X1; x += 5 + r() * 11) {
    const h = minHeight + r() * (maxHeight - minHeight);
    const w = h * (0.22 + r() * 0.1);
    const y = heightAt(x) + 3;
    // Two stacked tiers read as a fir at this size.
    trees.push(
      `M${fmt(x - w)} ${fmt(y)} L${fmt(x - w * 0.45)} ${fmt(y - h * 0.5)} L${fmt(x - w * 0.7)} ${fmt(y - h * 0.5)} ` +
        `L${fmt(x)} ${fmt(y - h)} L${fmt(x + w * 0.7)} ${fmt(y - h * 0.5)} L${fmt(x + w * 0.45)} ${fmt(y - h * 0.5)} L${fmt(x + w)} ${fmt(y)} Z`,
    );
  }
  return trees.join(" ");
}

const nearPoints = ridgeline({ seed: 47, base: 500, amp: 130, wavelength: 420, octaves: 3, ridged: false });
const frontPoints = ridgeline({ seed: 83, base: 545, amp: 90, wavelength: 520, octaves: 3, ridged: false });

/** Back to front: a snow range, a rocky range, then two forested ridges. */
export const RANGES = {
  far: alpineRange({ seed: 12, count: 9, high: 70, low: 290, base: 400, snowLine: 235, leftDrop: 150 }),
  mid: alpineRange({ seed: 31, count: 11, high: 250, low: 400, base: 470, snowLine: 0, leftDrop: 60 }),
  near: { shape: silhouette(nearPoints), trees: treeLine(nearPoints, 3, 9, 22) },
  front: { shape: silhouette(frontPoints), trees: treeLine(frontPoints, 17, 18, 44) },
};

const starRandom = seeded(7);
export const STARS = Array.from({ length: 70 }, () => ({
  left: `${(starRandom() * 100).toFixed(2)}%`,
  top: `${(starRandom() * 55).toFixed(2)}%`,
  size: `${(0.8 + starRandom() * 1.7).toFixed(1)}px`,
  delay: `${(starRandom() * 5).toFixed(2)}s`,
  duration: `${(3 + starRandom() * 4).toFixed(2)}s`,
}));
