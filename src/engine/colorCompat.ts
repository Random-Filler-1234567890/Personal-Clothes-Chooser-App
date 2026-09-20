const NEUTRALS = new Set([
  'black',
  'white',
  'off-white',
  'cream',
  'grey',
  'light-grey',
  'dark-grey',
  'charcoal',
  'navy',
  'denim',
  'beige',
  'tan',
  'khaki',
]);

const EARTH = new Set([
  'brown',
  'dark-brown',
  'light-brown',
  'espresso-brown',
  'olive',
  'dark-olive',
  'taupe',
  'gold',
]);

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

const CLASHES = new Set(
  [
    ['bright-green', 'dark-red'],
    ['bright-green', 'light-pink'],
    ['bright-green', 'dark-magenta'],
    ['red', 'light-pink'],
    ['red', 'dark-magenta'],
    ['purple', 'olive'],
    ['light-purple', 'dark-olive'],
    ['purple', 'dark-olive'],
    ['yellow', 'light-purple'],
    ['teal', 'dark-red'],
    ['green', 'red'],
    ['bright-green', 'red'],
    ['bright-green', 'purple'],
  ].map(([a, b]) => pairKey(a, b))
);

const GOOD_PAIRS = new Set(
  [
    ['navy', 'red'],
    ['navy', 'yellow'],
    ['olive', 'tan'],
    ['olive', 'brown'],
    ['light-blue', 'tan'],
    ['light-blue', 'brown'],
    ['dark-red', 'navy'],
    ['dark-magenta', 'grey'],
  ].map(([a, b]) => pairKey(a, b))
);

export function colorFamily(color: string): 'neutral' | 'earth' | 'bold' {
  const c = color.toLowerCase();
  if (NEUTRALS.has(c)) return 'neutral';
  if (EARTH.has(c)) return 'earth';
  return 'bold';
}

export function colorPairScore(a: string, b: string): number {
  const ca = a.toLowerCase();
  const cb = b.toLowerCase();
  if (ca === cb) return 1;
  const key = pairKey(ca, cb);
  if (CLASHES.has(key)) return -2;
  if (GOOD_PAIRS.has(key)) return 2;
  const fa = colorFamily(ca);
  const fb = colorFamily(cb);
  if (fa === 'neutral' || fb === 'neutral') return 1.5;
  if (fa === 'earth' && fb === 'earth') return 1;
  if (fa === 'earth' || fb === 'earth') return 0.5;
  return -0.5;
}

export function colorMatches(colors: string[], wanted?: string[]): boolean {
  if (!wanted || !wanted.length) return true;
  const lower = colors.map((c) => c.toLowerCase());
  return wanted.some((w) => lower.some((c) => c.includes(w.toLowerCase()) || w.toLowerCase().includes(c)));
}
