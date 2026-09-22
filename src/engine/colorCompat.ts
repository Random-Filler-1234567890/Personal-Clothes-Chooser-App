type Intensity = 'neutral' | 'muted' | 'pastel' | 'bright';

interface ColorInfo {
  intensity: Intensity;
  hue: number | null; // degrees on the color wheel, null for neutrals / unclassified
}

// Neutrals anchor almost any outfit and never really "clash" with anything else.
const NEUTRALS = new Set([
  'black',
  'white',
  'off-white',
  'cream',
  'ivory',
  'grey',
  'gray',
  'light-grey',
  'light-gray',
  'dark-grey',
  'dark-gray',
  'charcoal',
  'navy',
  'denim',
  'beige',
  'tan',
  'khaki',
  'silver',
]);

// Deep / earthy / desaturated tones. These read as grounded rather than loud, so
// they harmonize broadly with neutrals, other muted tones, and even bright accents.
const MUTED_HUES: Record<string, number> = {
  brown: 30,
  'dark-brown': 20,
  'light-brown': 35,
  'espresso-brown': 20,
  olive: 70,
  'dark-olive': 65,
  taupe: 30,
  gold: 45,
  mustard: 48,
  rust: 20,
  'dark-red': 355,
  maroon: 355,
  burgundy: 350,
  'dark-magenta': 320,
  plum: 300,
  teal: 180,
  'dark-teal': 180,
  'dark-green': 140,
  forest: 135,
  'dark-blue': 220,
  indigo: 245,
};

// Soft, low-saturation tones. They're gentle on the eye and rarely clash hard,
// but two very different pastel hues together can still look accidental.
const PASTEL_HUES: Record<string, number> = {
  'light-blue': 200,
  'light-purple': 270,
  lavender: 270,
  'light-pink': 340,
  blush: 350,
  mint: 150,
  peach: 25,
  'multicolor-pastel': NaN, // an intentionally mixed pastel print — treat as its own bucket
};

// Fully saturated colors. These carry the most visual weight, so two of them
// together is where real clashes happen.
const BRIGHT_HUES: Record<string, number> = {
  red: 0,
  scarlet: 5,
  'bright-green': 120,
  green: 130,
  emerald: 150,
  yellow: 50,
  orange: 30,
  purple: 280,
  violet: 275,
  magenta: 320,
  pink: 330,
  blue: 210,
  cobalt: 215,
  turquoise: 185,
  cyan: 190,
};

function classify(color: string): ColorInfo {
  const c = color.toLowerCase().trim();
  if (NEUTRALS.has(c)) return { intensity: 'neutral', hue: null };
  if (c in MUTED_HUES) return { intensity: 'muted', hue: MUTED_HUES[c] };
  if (c in PASTEL_HUES) return { intensity: 'pastel', hue: Number.isNaN(PASTEL_HUES[c]) ? null : PASTEL_HUES[c] };
  if (c in BRIGHT_HUES) return { intensity: 'bright', hue: BRIGHT_HUES[c] };
  // Unrecognized (likely hand-typed) color: assume it carries some weight but we
  // can't reason about its hue, so treat pairings with it as mildly uncertain.
  return { intensity: 'bright', hue: null };
}

export function colorFamily(color: string): Intensity {
  return classify(color).intensity;
}

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function pairKey(a: string, b: string): string {
  return [a.toLowerCase().trim(), b.toLowerCase().trim()].sort().join('|');
}

// Hand-tuned exceptions that override the general model in either direction —
// pairings that read as "clearly intentional" or "clearly clashing" regardless
// of what the hue math alone would say.
const CLASHES = new Set(
  [
    ['bright-green', 'red'],
    ['bright-green', 'pink'],
    ['bright-green', 'magenta'],
    ['red', 'pink'],
    ['red', 'orange'],
    ['purple', 'yellow'],
    ['purple', 'orange'],
    ['orange', 'pink'],
  ].map(([a, b]) => pairKey(a, b))
);

const GOOD_PAIRS = new Set(
  [
    ['navy', 'red'],
    ['navy', 'yellow'],
    ['navy', 'orange'],
    ['olive', 'tan'],
    ['olive', 'brown'],
    ['light-blue', 'tan'],
    ['light-blue', 'brown'],
    ['dark-red', 'navy'],
    ['dark-magenta', 'grey'],
    ['blue', 'orange'],
  ].map(([a, b]) => pairKey(a, b))
);

/**
 * Scores how well two colors work together, roughly on a -2 (actively clashing)
 * to +2 (clearly intentional pairing) scale. Neutrals and muted/earth tones are
 * forgiving; two fully saturated colors are where real clashes live, judged by
 * how far apart they sit on the color wheel.
 */
export function colorPairScore(a: string, b: string): number {
  const ca = a.toLowerCase().trim();
  const cb = b.toLowerCase().trim();
  if (ca === cb) return 1;

  const key = pairKey(ca, cb);
  if (CLASHES.has(key)) return -2;
  if (GOOD_PAIRS.has(key)) return 2;

  const ia = classify(ca);
  const ib = classify(cb);

  if (ia.intensity === 'neutral' || ib.intensity === 'neutral') return 1.4;
  if (ia.intensity === 'muted' && ib.intensity === 'muted') return 1.1;

  if (ia.intensity === 'pastel' && ib.intensity === 'pastel') return 0.7;

  const oneMutedOnePastel =
    (ia.intensity === 'muted' && ib.intensity === 'pastel') || (ia.intensity === 'pastel' && ib.intensity === 'muted');
  if (oneMutedOnePastel) return 0.6;

  const oneMutedOneBright =
    (ia.intensity === 'muted' && ib.intensity === 'bright') || (ia.intensity === 'bright' && ib.intensity === 'muted');
  if (oneMutedOneBright) {
    if (ia.hue === null || ib.hue === null) return 0.2;
    return hueDistance(ia.hue, ib.hue) <= 60 ? 0.7 : 0.2;
  }

  const onePastelOneBright =
    (ia.intensity === 'pastel' && ib.intensity === 'bright') || (ia.intensity === 'bright' && ib.intensity === 'pastel');
  if (onePastelOneBright) {
    if (ia.hue === null || ib.hue === null) return 0;
    return hueDistance(ia.hue, ib.hue) <= 60 ? 0.5 : -0.3;
  }

  // Both bright/fully-saturated: this is where genuine clashes live. Judge by
  // how far apart the two hues sit on the color wheel.
  if (ia.hue === null || ib.hue === null) return -0.4;
  const dist = hueDistance(ia.hue, ib.hue);
  if (dist <= 30) return 0.8; // analogous — reads as intentional
  if (dist <= 90) return -0.6; // busy — two loud, unrelated colors
  if (dist <= 150) return -1.2; // triadic clash — genuinely loud
  return -1.8; // near-complementary — the classic "diabolical" clash
}

export function colorMatches(colors: string[], wanted?: string[]): boolean {
  if (!wanted || !wanted.length) return true;
  const lower = colors.map((c) => c.toLowerCase());
  return wanted.some((w) => lower.some((c) => c.includes(w.toLowerCase()) || w.toLowerCase().includes(c)));
}

/**
 * Outfits built from more than a handful of distinct strong colors read as
 * chaotic even if every individual pair is technically "fine" — pairwise
 * averaging alone can't see that. Neutrals don't count toward the total.
 */
export function tooManyColorsPenalty(colors: string[]): number {
  const distinctNonNeutral = new Set(
    colors.map((c) => c.toLowerCase().trim()).filter((c) => classify(c).intensity !== 'neutral')
  );
  const count = distinctNonNeutral.size;
  if (count <= 2) return 0;
  if (count === 3) return -6;
  if (count === 4) return -16;
  return -28;
}
