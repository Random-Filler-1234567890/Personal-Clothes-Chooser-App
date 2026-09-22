import { FORMALITY_ORDER } from '@/src/constants/categories';
import { colorHueInfo, neutralShade } from '@/src/engine/colorCompat';
import type { Category, ClothingItem } from '@/src/types';

const VISIBLE_CATEGORIES: Category[] = ['top', 'bottom', 'shorts', 'outerwear', 'shoes'];

/**
 * Objective, outfit-derived descriptors — no user preference involved. These are
 * shown as small chips alongside a score so an outfit reads as more than a number.
 */
export function computeVibeTags(items: ClothingItem[]): string[] {
  const visible = items.filter((i) => VISIBLE_CATEGORIES.includes(i.category));
  if (!visible.length) return [];
  const tags: string[] = [];

  const levels = visible.map((i) => FORMALITY_ORDER[i.formality]);
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
  if (avgLevel >= 2.4) tags.push('Sharp');
  else if (avgLevel <= 0.6) tags.push('Relaxed');
  else tags.push('Versatile');

  const hasPattern = visible.some((i) => !!i.pattern);
  const colorInfos = visible.flatMap((i) => i.colors.map((c) => colorHueInfo(c)));
  const brightCount = colorInfos.filter((c) => c.intensity === 'bright').length;
  const allNeutral = colorInfos.length > 0 && colorInfos.every((c) => c.intensity === 'neutral');

  if (hasPattern || brightCount >= 2) tags.push('Bold');
  else if (allNeutral) tags.push('Understated');
  else tags.push('Refined');

  const shades = new Set(visible.flatMap((i) => i.colors.map((c) => neutralShade(c)).filter((s): s is 'light' | 'dark' => !!s)));
  if (shades.has('light') && shades.has('dark')) tags.push('High-contrast');

  const fits = visible.map((i) => i.fit).filter((f): f is NonNullable<typeof f> => !!f);
  const isLoose = fits.some((f) => f === 'loose' || f === 'relaxed');
  const isTight = fits.some((f) => f === 'tight');
  if (isLoose && isTight) tags.push('Balanced fit');
  else if (isLoose) tags.push('Relaxed fit');
  else if (isTight) tags.push('Fitted');

  return Array.from(new Set(tags)).slice(0, 3);
}
