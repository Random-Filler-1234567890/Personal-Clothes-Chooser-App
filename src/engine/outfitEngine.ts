import { FORMALITY_LABEL, FORMALITY_ORDER } from '@/src/constants/categories';
import { colorMatches, colorPairScore, tooManyColorsPenalty } from '@/src/engine/colorCompat';
import { scoreToTier } from '@/src/engine/tierEngine';
import type {
  Category,
  ClothingItem,
  Formality,
  GeneratedOutfit,
  GenerationCriteria,
  Season,
  SockPreference,
} from '@/src/types';
import { daysSince } from '@/src/utils/date';

type Pools = Record<Category, ClothingItem[]>;

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

function biasedPick(pool: ClothingItem[], mustColors?: string[]): ClothingItem | undefined {
  if (!pool.length) return undefined;
  if (mustColors?.length) {
    const matches = pool.filter((i) => colorMatches(i.colors, mustColors));
    if (matches.length && Math.random() < 0.8) return pickRandom(matches);
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
  sockPreference: SockPreference
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

  bottom = bottom ?? biasedPick(bottomPool, criteria.mustIncludeColors);
  if (!bottom) return null;
  chosen.push(bottom);

  top = top ?? biasedPick(pools.top, criteria.mustIncludeColors);
  if (!top) return null;
  chosen.push(top);

  const shoes = biasedPick(pools.shoes, criteria.mustIncludeColors);
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
    const belt = biasedPick(pools.belt);
    if (belt) chosen.push(belt);
  }

  const wantsOuterwear = !!criteria.restrictCategory?.outerwear?.length;
  const outerwearChance = criteria.formality === 'formal' ? 0.65 : 0.4;
  if (pools.outerwear.length && (forcedCats.has('outerwear') || wantsOuterwear || Math.random() < outerwearChance)) {
    const outer = biasedPick(pools.outerwear, criteria.mustIncludeColors);
    if (outer) chosen.push(outer);
  }

  if (pools.tie.length && (forcedCats.has('tie') || (criteria.formality === 'formal' && Math.random() < 0.5))) {
    const tie = biasedPick(pools.tie, criteria.mustIncludeColors);
    if (tie) chosen.push(tie);
  }

  return chosen.map((i) => i.id);
}

const VISIBLE_CATEGORIES: Category[] = ['top', 'bottom', 'shorts', 'outerwear', 'shoes'];

export function scoreCandidate(
  items: ClothingItem[],
  criteria: Pick<GenerationCriteria, 'mustIncludeColors' | 'season' | 'unwornForDays'>
): { score: number; pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];
  let score = 50;

  // --- Formality coherence ---
  const levels = items.map((i) => FORMALITY_ORDER[i.formality]);
  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  const range = maxLevel - minLevel;
  const loFormality = (Object.keys(FORMALITY_ORDER) as Formality[]).find((f) => FORMALITY_ORDER[f] === minLevel)!;
  const hiFormality = (Object.keys(FORMALITY_ORDER) as Formality[]).find((f) => FORMALITY_ORDER[f] === maxLevel)!;
  if (range === 0) {
    score += 20;
    pros.push(`Every piece reads ${FORMALITY_LABEL[loFormality].toLowerCase()} — nothing fights for the wrong occasion.`);
  } else if (range === 1) {
    score += 8;
    pros.push('Formality mostly matches, with one slightly dressier or more relaxed piece.');
  } else if (range === 2) {
    score -= 18;
    cons.push(`Mixing ${FORMALITY_LABEL[loFormality].toLowerCase()} and ${FORMALITY_LABEL[hiFormality].toLowerCase()} pieces reads as a mismatched occasion.`);
  } else {
    score -= 42;
    cons.push(`${FORMALITY_LABEL[loFormality]} and ${FORMALITY_LABEL[hiFormality]} pieces together is a genuine clash — pick one lane.`);
  }

  // --- Color harmony ---
  const visible = items.filter((i) => VISIBLE_CATEGORIES.includes(i.category));
  const colorList = visible.flatMap((i) => i.colors.slice(0, 2));
  let pairSum = 0;
  let pairCount = 0;
  for (let a = 0; a < colorList.length; a++) {
    for (let b = a + 1; b < colorList.length; b++) {
      pairSum += colorPairScore(colorList[a], colorList[b]);
      pairCount++;
    }
  }
  const avgPair = pairCount ? pairSum / pairCount : 1;
  score += avgPair >= 0 ? avgPair * 14 : avgPair * 22;

  if (avgPair >= 1.3) pros.push('Colors are clearly coordinated.');
  else if (avgPair >= 0.4) pros.push('Color pairing is safe and easy to wear.');
  else if (avgPair >= -0.3) cons.push('A couple of colors sit awkwardly next to each other.');
  else cons.push('Colors are actively clashing — these hues fight instead of working together.');

  const colorCountPenalty = tooManyColorsPenalty(colorList);
  score += colorCountPenalty;
  if (colorCountPenalty <= -16) {
    cons.push('Too many competing colors at once — the eye doesn’t know where to land.');
  } else if (colorCountPenalty <= -6) {
    cons.push('A few different colors in play; one more neutral piece would calm it down.');
  }

  // --- Pattern density ---
  const patternedCount = visible.filter((i) => !!i.pattern).length;
  if (patternedCount >= 2) {
    score -= 18;
    cons.push(`${patternedCount} busy graphics/patterns are competing for attention at once.`);
  } else if (patternedCount === 1) {
    score += 1;
  } else {
    score += 2;
    pros.push('Clean, uncluttered silhouette with no competing patterns.');
  }

  // --- Recency (informational only — doesn't move the fashion score) ---
  const daysList = items.map((i) => Math.min(daysSince(i.lastWornAt), 45));
  const avgDays = daysList.reduce((a, b) => a + b, 0) / (daysList.length || 1);
  if (avgDays > 20) pros.push("Brings back pieces you haven't worn in a while.");

  // --- Season fit ---
  if (criteria.season && criteria.season !== 'all') {
    const mismatched = visible.filter((i) => i.season && i.season !== 'all' && i.season !== criteria.season);
    if (mismatched.length) {
      score -= mismatched.length * 12;
      cons.push(`${mismatched.length} piece${mismatched.length > 1 ? 's' : ''} fight${mismatched.length > 1 ? '' : 's'} the ${criteria.season} weather you asked for.`);
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

  score += Math.random() * 6 - 3;
  score = Math.max(0, Math.min(100, Math.round(score)));

  if (!pros.length) pros.push('Nothing offensive here, but nothing elevated either.');
  if (!cons.length) cons.push('No real weaknesses spotted.');

  return { score, pros, cons };
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
  sockPreference: SockPreference = 'random'
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
    const itemIds = buildCandidate(pools, forcedCats, criteria, preferPants, sockPreference);
    if (!itemIds) continue;
    const key = [...itemIds].sort().join(',');
    if (seen.has(key)) continue;
    seen.add(key);

    const items = itemIds.map((id) => closet.find((c) => c.id === id)).filter((i): i is ClothingItem => !!i);
    const { score, pros, cons } = scoreCandidate(items, criteria);
    candidates.push({ itemIds, score, tier: scoreToTier(score), pros, cons });
  }

  let pool: GeneratedOutfit[];
  if (criteria.quality === 'good') {
    const good = candidates.filter((c) => c.score >= 60);
    pool = good.length >= criteria.count ? good : [...candidates].sort((a, b) => b.score - a.score);
    pool = [...pool].sort((a, b) => b.score - a.score);
  } else if (criteria.quality === 'bad') {
    const bad = candidates.filter((c) => c.score <= 40);
    pool = bad.length >= criteria.count ? bad : [...candidates].sort((a, b) => a.score - b.score);
    pool = [...pool].sort((a, b) => a.score - b.score);
  } else {
    pool = shuffle(candidates);
  }

  return pool.slice(0, criteria.count);
}
