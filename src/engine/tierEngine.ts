import type { Tier } from '@/src/types';

// S requires several things to go right at once (perfect formality match, a
// deliberate color story, balanced fit, a clean focal point) plus favorable
// jitter — it should be rare, the way an actually iconic outfit is rare.
// A hard color clash or a genuine formality mismatch is capped well below
// these thresholds in scoreCandidate, so a real problem can never buy its way
// into A/S through unrelated bonuses.
const THRESHOLDS: [number, Tier][] = [
  [90, 'S'],
  [76, 'A'],
  [58, 'B'],
  [40, 'C'],
  [22, 'D'],
];

export function scoreToTier(score: number): Tier {
  for (const [min, tier] of THRESHOLDS) {
    if (score >= min) return tier;
  }
  return 'F';
}
