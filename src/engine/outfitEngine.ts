import { FORMALITY_LABEL, FORMALITY_ORDER } from '@/src/constants/categories';
import { colorHueInfo, colorMatches, colorPairScore, isWarmHue, tooManyColorsPenalty, type ColorInfo } from '@/src/engine/colorCompat';
import { scoreToTier } from '@/src/engine/tierEngine';
import { computeVibeTags } from '@/src/engine/vibeEngine';
import type {
  BoldnessPreference,
  Category,
  ClothingItem,
  ColorUndertone,
  Formality,
  GeneratedOutfit,
  GenerationCriteria,
  Season,
  SockPreference,
  StyleLeaning,
} from '@/src/types';
import { daysSince } from '@/src/utils/date';

type Pools = Record<Category, ClothingItem[]>;

export interface StyleProfile {
  boldness: BoldnessPreference;
  styleLeaning: StyleLeaning;
  colorUndertone: ColorUndertone;
}

export const DEFAULT_STYLE_PROFILE: StyleProfile = {
  boldness: 'balanced',
  styleLeaning: 'none',
  colorUndertone: 'unknown',
};

function passesFormality(itemFormality: Formality, target?: Formality): boolean {
  if (!target) return true;
  return Math.abs(FORMALITY_ORDER[itemFormality] - FORMALITY_ORDER[target]) <= 1;
}

function passesSeason(item: ClothingItem, season?: Season): boolean {
  if (!season || season === 'all' || !item.season || item.season === 'all') return true;
  return item.season === season;
}

function buildPools(closet: ClothingItem[], criteria: GenerationCriteria): { pools: Pools; forcedCats: Set<Category> } {
  const exclude = new Set(criteria.excludeItemIds ?? []);
  const forcedCats = new Set<Category>();
  const forced = new Map<Category, ClothingItem>();
  for (const id of criteria.mustIncludeItemIds ?? []) {
    const item = closet.find((c) => c.id === id);
    if (item) {
      forced.set(item.category, item);
      forcedCats.add(item.category);
    }
  }

  const pools: Pools = {
    top: [],
    bottom: [],
    shorts: [],
    outerwear: [],
    shoes: [],
    socks: [],
    belt: [],
    tie: [],
    sleepwear: [],
    swimwear: [],
  };

  for (const item of closet) {
    if (item.archived || exclude.has(item.id)) continue;
    if (item.category === 'sleepwear' || item.category === 'swimwear') continue;
    if (!passesFormality(item.formality, criteria.formality)) continue;
    if (!passesSeason(item, criteria.season)) continue;
    const restrictColors = criteria.restrictCategory?.[item.category];
    if (restrictColors?.length && !colorMatches(item.colors, restrictColors)) continue;
    pools[item.category].push(item);
  }

  for (const [cat, item] of forced) {
    pools[cat] = [item];
  }

  return { pools, forcedCats };
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function biasedPick(pool: ClothingItem[], mustColors?: string[], boldness: BoldnessPreference = 'balanced'): ClothingItem | undefined {
  if (!pool.length) return undefined;
  if (mustColors?.length) {
    const matches = pool.filter((i) => colorMatches(i.colors, mustColors));
    if (matches.length && Math.random() < 0.8) return pickRandom(matches);
  }
  if (boldness === 'bold') {
    const patterned = pool.filter((i) => !!i.pattern);
    if (patterned.length && Math.random() < 0.55) return pickRandom(patterned);
  } else if (boldness === 'subtle') {
    const plain = pool.filter((i) => !i.pattern);
    if (plain.length && Math.random() < 0.7) return pickRandom(plain);
  }
  return pickRandom(pool);
}

function pickSocks(pool: ClothingItem[], preference: SockPreference): ClothingItem | undefined {
  if (!pool.length) return undefined;
  if (preference === 'random') return pickRandom(pool);
  const matches = pool.filter((i) => colorMatches(i.colors, [preference]));
  return matches.length ? pickRandom(matches) : pickRandom(pool);
}

function buildCandidate(
  pools: Pools,
  forcedCats: Set<Category>,
  criteria: GenerationCriteria,
  preferPants: boolean,
  sockPreference: SockPreference,
  boldness: BoldnessPreference
): string[] | null {
  const chosen: ClothingItem[] = [];
  const hasShortsHint = !!criteria.restrictCategory?.shorts?.length;
  const hasBottomHint = !!criteria.restrictCategory?.bottom?.length;

  let useShorts: boolean;
  if (forcedCats.has('shorts')) useShorts = true;
  else if (forcedCats.has('bottom')) useShorts = false;
  else if (hasShortsHint && !hasBottomHint) useShorts = true;
  else if (hasBottomHint && !hasShortsHint) useShorts = false;
  else {
    const pantsAvail = pools.bottom.length > 0;
    const shortsAvail = pools.shorts.length > 0;
    if (pantsAvail && shortsAvail) useShorts = Math.random() > (preferPants ? 0.78 : 0.5);
    else useShorts = shortsAvail && !pantsAvail;
  }

  const bottomPool = useShorts ? pools.shorts : pools.bottom;

  let bottom: ClothingItem | undefined;
  let top: ClothingItem | undefined;

  if (criteria.quality === 'bad' && Math.random() < 0.7) {
    const extremePairs: [number, number][] = [
      [0, 3],
      [0, 2],
      [1, 3],
    ];
    const [levelA, levelB] = extremePairs[Math.floor(Math.random() * extremePairs.length)];
    const flip = Math.random() < 0.5;
    const bottomLevel = flip ? levelA : levelB;
    const topLevel = flip ? levelB : levelA;
    const clashBottomPool = bottomPool.filter((i) => FORMALITY_ORDER[i.formality] === bottomLevel);
    const clashTopPool = pools.top.filter((i) => FORMALITY_ORDER[i.formality] === topLevel);
    if (clashBottomPool.length && clashTopPool.length) {
      bottom = pickRandom(clashBottomPool);
      top = pickRandom(clashTopPool);
    }
  }

  bottom = bottom ?? biasedPick(bottomPool, criteria.mustIncludeColors, boldness);
  if (!bottom) return null;
  chosen.push(bottom);

  top = top ?? biasedPick(pools.top, criteria.mustIncludeColors, boldness);
  if (!top) return null;
  chosen.push(top);

  const shoes = biasedPick(pools.shoes, criteria.mustIncludeColors, boldness);
  if (!shoes) return null;
  chosen.push(shoes);

  if (pools.socks.length && (forcedCats.has('socks') || Math.random() < 0.9)) {
    const socks = forcedCats.has('socks') ? pools.socks[0] : pickSocks(pools.socks, sockPreference);
    if (socks) chosen.push(socks);
  }

  const bottomIsDressy =
    bottom.subcategory === 'chinos' ||
    bottom.subcategory === 'dress-pants' ||
    bottom.subcategory === 'jeans' ||
    bottom.subcategory === 'dress-shorts';
  if (pools.belt.length && (forcedCats.has('belt') || (bottomIsDressy && Math.random() < 0.55))) {
    const belt = biasedPick(pools.belt, undefined, boldness);
    if (belt) chosen.push(belt);
  }

  const wantsOuterwear = !!criteria.restrictCategory?.outerwear?.length;
  let outerwearChance = criteria.formality === 'formal' ? 0.65 : 0.4;
  if (boldness === 'bold') outerwearChance = Math.min(1, outerwearChance + 0.15);
  else if (boldness === 'subtle') outerwearChance = Math.max(0, outerwearChance - 0.15);
  if (pools.outerwear.length && (forcedCats.has('outerwear') || wantsOuterwear || Math.random() < outerwearChance)) {
    const outer = biasedPick(pools.outerwear, criteria.mustIncludeColors, boldness);
    if (outer) chosen.push(outer);
  }

  if (pools.tie.length && (forcedCats.has('tie') || (criteria.formality === 'formal' && Math.random() < 0.5))) {
    const tie = biasedPick(pools.tie, criteria.mustIncludeColors, boldness);
    if (tie) chosen.push(tie);
  }

  return chosen.map((i) => i.id);
}

const VISIBLE_CATEGORIES: Category[] = ['top', 'bottom', 'shorts', 'outerwear', 'shoes'];

interface ColorEntry {
  item: ClothingItem;
  color: string;
}

interface PairInfo {
  a: ColorEntry;
  b: ColorEntry;
  score: number;
}

function analyzeColorPairs(entries: ColorEntry[]): { best: PairInfo | null; worst: PairInfo | null; avg: number; count: number } {
  let sum = 0;
  let count = 0;
  let best: PairInfo | null = null;
  let worst: PairInfo | null = null;
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (entries[i].item.id === entries[j].item.id) continue;
      const score = colorPairScore(entries[i].color, entries[j].color);
      sum += score;
      count++;
      if (!best || score > best.score) best = { a: entries[i], b: entries[j], score };
      if (!worst || score < worst.score) worst = { a: entries[i], b: entries[j], score };
    }
  }
  return { best, worst, avg: count ? sum / count : 1, count };
}

function styleLeaningNote(leaning: StyleLeaning, vibeTags: string[]): string | null {
  if (leaning === 'none') return null;
  const bold = vibeTags.includes('Bold');
  const sharp = vibeTags.includes('Sharp');
  const understated = vibeTags.includes('Understated') || vibeTags.includes('Refined');
  const relaxedFit = vibeTags.includes('Relaxed fit');
  const fitted = vibeTags.includes('Fitted') || vibeTags.includes('Balanced fit');

  if (leaning === 'masculine') {
    if (sharp || fitted) return 'Reads confidently masculine — structured and put-together without trying too hard.';
    if (bold) return "Bold and direct — a masculine look that isn't afraid to make a statement.";
    return 'A clean, grounded masculine look — understated rather than flashy.';
  }
  if (leaning === 'feminine') {
    if (relaxedFit || understated) return 'Soft and effortless — a graceful, feminine silhouette.';
    if (bold) return 'Bold with a feminine edge — confident without losing softness.';
    return 'A polished, feminine look with clean lines.';
  }
  if (sharp) return 'Reads polished and gender-neutral — sharp without leaning one way or another.';
  return 'A relaxed, gender-neutral look that keeps the focus on fit and color rather than convention.';
}

function undertoneNote(
  undertone: ColorUndertone,
  accentColors: [string, ClothingItem][]
): { text: string; matches: boolean } | null {
  if (undertone === 'unknown' || undertone === 'neutral' || !accentColors.length) return null;
  const hueClassified = accentColors
    .map(([color]) => colorHueInfo(color))
    .filter((info): info is ColorInfo & { hue: number } => info.hue !== null);
  if (!hueClassified.length) return null;
  const warmCount = hueClassified.filter((h) => isWarmHue(h.hue)).length;
  const dominant: 'warm' | 'cool' = warmCount >= hueClassified.length - warmCount ? 'warm' : 'cool';
  if (dominant === undertone) {
    return { text: `This ${dominant}-toned palette complements a ${undertone} undertone nicely.`, matches: true };
  }
  const suggestion = undertone === 'warm' ? 'warmth (tan, olive, rust, brown)' : 'coolness (blue, teal, grey)';
  return {
    text: `This ${dominant}-leaning palette sits a little flat against a ${undertone} undertone — a piece with more ${suggestion} would balance it.`,
    matches: false,
  };
}

export function scoreCandidate(
  items: ClothingItem[],
  criteria: Pick<GenerationCriteria, 'mustIncludeColors' | 'season' | 'unwornForDays'>,
  styleProfile: Pick<StyleProfile, 'styleLeaning' | 'colorUndertone'> = DEFAULT_STYLE_PROFILE
): { score: number; pros: string[]; cons: string[]; vibeTags: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];
  let score = 42;

  const visible = items.filter((i) => VISIBLE_CATEGORIES.includes(i.category));

  // --- Formality coherence ---
  const levels = visible.map((i) => FORMALITY_ORDER[i.formality]);
  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  const range = maxLevel - minLevel;
  const loFormality = (Object.keys(FORMALITY_ORDER) as Formality[]).find((f) => FORMALITY_ORDER[f] === minLevel)!;
  const hiFormality = (Object.keys(FORMALITY_ORDER) as Formality[]).find((f) => FORMALITY_ORDER[f] === maxLevel)!;
  const lowItem = visible.find((i) => i.formality === loFormality)!;
  const highItem = visible.find((i) => i.formality === hiFormality)!;

  if (range === 0) {
    score += 16;
    pros.push(`Every piece reads ${FORMALITY_LABEL[loFormality].toLowerCase()} — nothing fights for the wrong occasion.`);
  } else if (range === 1) {
    score += 5;
    pros.push(`${highItem.name} sits just a touch dressier than the rest — still reads coherent.`);
  } else if (range === 2) {
    score -= 20;
    cons.push(`${highItem.name} (${FORMALITY_LABEL[hiFormality].toLowerCase()}) next to ${lowItem.name} (${FORMALITY_LABEL[loFormality].toLowerCase()}) reads as a mismatched occasion.`);
  } else {
    score -= 46;
    cons.push(`${highItem.name} (${FORMALITY_LABEL[hiFormality].toLowerCase()}) and ${lowItem.name} (${FORMALITY_LABEL[loFormality].toLowerCase()}) together is a genuine clash — pick one lane.`);
  }

  // --- Color harmony (item-aware) ---
  const entries: ColorEntry[] = visible.flatMap((i) => i.colors.slice(0, 2).map((color) => ({ item: i, color })));
  const { worst, avg } = analyzeColorPairs(entries);
  score += avg >= 0 ? avg * 11 : avg * 24;

  const hasHardClash = !!worst && worst.score <= -1.2;
  const hasMildClash = !!worst && !hasHardClash && worst.score <= -0.3;

  const nonNeutralByColor = new Map<string, ClothingItem>();
  for (const e of entries) {
    const key = e.color.toLowerCase().trim();
    if (colorHueInfo(e.color).intensity !== 'neutral' && !nonNeutralByColor.has(key)) {
      nonNeutralByColor.set(key, e.item);
    }
  }
  const accentColors = Array.from(nonNeutralByColor.entries());

  if (accentColors.length === 0) {
    if (maxLevel >= FORMALITY_ORDER['smart-casual']) {
      score += 3;
      pros.push('A tonal, all-neutral palette reads clean and intentional for the occasion.');
    } else {
      score -= 3;
      cons.push('Every piece is neutral — safe, but a single accent color would give this more personality.');
    }
  } else if (accentColors.length === 1) {
    const [color, owner] = accentColors[0];
    score += 4;
    pros.push(`${owner.name}'s ${color} is the only real color in the mix — a clean, deliberate accent against the neutrals.`);
  } else if (accentColors.length === 2 && !hasHardClash && !hasMildClash) {
    const [[colorA, ownerA], [colorB, ownerB]] = accentColors;
    const pairQuality = colorPairScore(colorA, colorB);
    if (pairQuality >= 1.5) {
      score += 8;
      pros.push(`${ownerA.name} and ${ownerB.name} pair ${colorA} with ${colorB} — a genuinely sharp, intentional color combo.`);
    } else {
      score += 6;
      pros.push(`${ownerA.name} and ${ownerB.name} pair ${colorA} with ${colorB} for a deliberate two-color story.`);
    }
  } else if (accentColors.length >= 4) {
    cons.push(`${accentColors.length} different colors in play at once (${accentColors.map(([c]) => c).join(', ')}) — that's a lot for the eye to track.`);
  }

  if (worst && hasHardClash) {
    cons.push(`${worst.a.item.name} (${worst.a.color}) and ${worst.b.item.name} (${worst.b.color}) actively clash — these hues fight instead of working together.`);
  } else if (worst && hasMildClash) {
    cons.push(`${worst.a.item.name} and ${worst.b.item.name} sit a little awkwardly together color-wise.`);
  }

  const colorList = entries.map((e) => e.color);
  const colorCountPenalty = tooManyColorsPenalty(colorList);
  score += colorCountPenalty;

  // --- Silhouette / fit balance ---
  const bottomItem = visible.find((i) => i.category === 'bottom' || i.category === 'shorts');
  const topItem = visible.find((i) => i.category === 'top');
  if (bottomItem?.fit && topItem?.fit) {
    const looseSet = new Set(['loose', 'relaxed']);
    const topLoose = looseSet.has(topItem.fit);
    const bottomLoose = looseSet.has(bottomItem.fit);
    const topTight = topItem.fit === 'tight';
    const bottomTight = bottomItem.fit === 'tight';
    if (topLoose && bottomLoose) {
      score -= 6;
      cons.push(`${topItem.name} and ${bottomItem.name} are both loose through the body — pairing one relaxed piece with a fitted one usually reads sharper.`);
    } else if ((topLoose && bottomTight) || (topTight && bottomLoose)) {
      score += 5;
      pros.push(`${topItem.name} and ${bottomItem.name} balance a relaxed piece against a fitted one for a clean silhouette.`);
    }
  }

  // --- Pattern density (item-aware) ---
  const patternedItems = visible.filter((i) => !!i.pattern);
  if (patternedItems.length >= 2) {
    score -= 20;
    cons.push(`${patternedItems.map((i) => i.name).join(' and ')} are both busy with graphics or patterns, competing for attention at once.`);
  } else if (patternedItems.length === 1) {
    const p = patternedItems[0];
    if (accentColors.length <= 1) {
      score += 4;
      pros.push(`${p.name}'s ${p.pattern} is the outfit's clear focal point, and everything else wisely stays out of its way.`);
    } else {
      score += 1;
    }
  } else {
    score += 2;
    pros.push('Clean, uncluttered silhouette with no competing patterns.');
  }

  // --- Recency (informational only — doesn't move the fashion score) ---
  const daysList = items.map((i) => Math.min(daysSince(i.lastWornAt), 45));
  const avgDays = daysList.reduce((a, b) => a + b, 0) / (daysList.length || 1);
  if (avgDays > 20) pros.push("Brings back pieces you haven't worn in a while.");

  // --- Season fit (item-aware) ---
  if (criteria.season && criteria.season !== 'all') {
    const mismatched = visible.filter((i) => i.season && i.season !== 'all' && i.season !== criteria.season);
    if (mismatched.length) {
      score -= mismatched.length * 12;
      cons.push(`${mismatched.map((i) => i.name).join(', ')} ${mismatched.length > 1 ? "don't" : "doesn't"} suit the ${criteria.season} weather you asked for.`);
    } else {
      pros.push(`Every piece fits ${criteria.season} weather.`);
    }
  }

  if (criteria.mustIncludeColors?.length) {
    const matched = items.some((i) => colorMatches(i.colors, criteria.mustIncludeColors));
    if (matched) score += 6;
  }

  if (criteria.unwornForDays) {
    for (const item of items) {
      const d = daysSince(item.lastWornAt);
      if (d >= criteria.unwornForDays) score += 8;
      else if (item.lastWornAt) score -= 4;
    }
  }

  // --- Hard caps: a real problem can never be scored away by unrelated bonuses ---
  if (hasHardClash) score = Math.min(score, 54);
  if (range === 2) score = Math.min(score, 58);
  if (range >= 3) score = Math.min(score, 46);
  if (accentColors.length >= 4) score = Math.min(score, 60);
  if (patternedItems.length >= 3) score = Math.min(score, 60);

  score += Math.random() * 4 - 2;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const vibeTags = computeVibeTags(items);

  if (score >= 90) {
    pros.unshift('This is the complete package — formality, color, and fit are all pulling in the same direction. A genuine go-to.');
  }

  const leaningNote = styleLeaningNote(styleProfile.styleLeaning, vibeTags);
  if (leaningNote) pros.push(leaningNote);
  const toneNote = undertoneNote(styleProfile.colorUndertone, accentColors);
  if (toneNote) (toneNote.matches ? pros : cons).push(toneNote.text);

  if (!pros.length) pros.push('Nothing offensive here, but nothing elevated either.');
  if (!cons.length) cons.push('No real weaknesses spotted.');

  return { score, pros, cons, vibeTags };
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateOutfits(
  closet: ClothingItem[],
  criteria: GenerationCriteria,
  preferPants: boolean,
  sockPreference: SockPreference = 'random',
  styleProfile: StyleProfile = DEFAULT_STYLE_PROFILE
): GeneratedOutfit[] {
  const { pools, forcedCats } = buildPools(closet, criteria);
  const hasBottomSlot = pools.bottom.length > 0 || pools.shorts.length > 0;
  if (!pools.top.length || !hasBottomSlot || !pools.shoes.length) {
    return [];
  }

  const seen = new Set<string>();
  const candidates: GeneratedOutfit[] = [];
  const maxAttempts = 500;

  for (let i = 0; i < maxAttempts && candidates.length < 80; i++) {
    const itemIds = buildCandidate(pools, forcedCats, criteria, preferPants, sockPreference, styleProfile.boldness);
    if (!itemIds) continue;
    const key = [...itemIds].sort().join(',');
    if (seen.has(key)) continue;
    seen.add(key);

    const items = itemIds.map((id) => closet.find((c) => c.id === id)).filter((i): i is ClothingItem => !!i);
    const { score, pros, cons, vibeTags } = scoreCandidate(items, criteria, styleProfile);
    candidates.push({ itemIds, score, tier: scoreToTier(score), pros, cons, vibeTags });
  }

  let pool: GeneratedOutfit[];
  if (criteria.quality === 'good') {
    const good = candidates.filter((c) => c.score >= 60);
    const source = good.length >= criteria.count ? good : candidates;
    // Taking a strict top-N by score would show the same handful of "best of 80"
    // outfits every single time, which is exactly the "everything looks the same"
    // complaint. Instead, take a generous top slice and shuffle within it, so
    // repeated "good" rolls surface genuinely different (but still good) fits —
    // an S-tier candidate stays eligible, but isn't guaranteed on every roll.
    const sorted = [...source].sort((a, b) => b.score - a.score);
    const sliceSize = Math.max(criteria.count * 5, Math.ceil(sorted.length * 0.4));
    pool = shuffle(sorted.slice(0, sliceSize));
  } else if (criteria.quality === 'bad') {
    const bad = candidates.filter((c) => c.score <= 40);
    const source = bad.length >= criteria.count ? bad : candidates;
    const sorted = [...source].sort((a, b) => a.score - b.score);
    const sliceSize = Math.max(criteria.count * 5, Math.ceil(sorted.length * 0.4));
    pool = shuffle(sorted.slice(0, sliceSize));
  } else {
    pool = shuffle(candidates);
  }

  const selected = pool.slice(0, criteria.count);
  if (criteria.quality === 'good') selected.sort((a, b) => b.score - a.score);
  else if (criteria.quality === 'bad') selected.sort((a, b) => a.score - b.score);
  return selected;
}
