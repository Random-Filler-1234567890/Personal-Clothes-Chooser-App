import type { Tier } from '@/src/types';

const THRESHOLDS: [number, Tier][] = [
  [90, 'S'],
  [76, 'A'],
  [60, 'B'],
  [44, 'C'],
  [28, 'D'],
];

export function scoreToTier(score: number): Tier {
  for (const [min, tier] of THRESHOLDS) {
    if (score >= min) return tier;
  }
  return 'F';
}
