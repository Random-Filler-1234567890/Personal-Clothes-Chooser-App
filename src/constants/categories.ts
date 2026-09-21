import type { IoniconName } from '@/src/components/Icon';
import type { Category, Fit, Formality, Season, Sleeve, Subcategory, Tier } from '@/src/types';

export const CATEGORY_LABEL: Record<Category, string> = {
  top: 'Top',
  bottom: 'Pants',
  shorts: 'Shorts',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  socks: 'Socks',
  belt: 'Belt',
  tie: 'Tie',
  sleepwear: 'Sleepwear',
  swimwear: 'Swimwear',
};

export const CATEGORY_ICON: Record<Category, IoniconName> = {
  top: 'shirt-outline',
  bottom: 'body-outline',
  shorts: 'body-outline',
  outerwear: 'layers-outline',
  shoes: 'walk-outline',
  socks: 'square-outline',
  belt: 'remove-outline',
  tie: 'triangle-outline',
  sleepwear: 'moon-outline',
  swimwear: 'water-outline',
};

export const SUBCATEGORY_LABEL: Record<Subcategory, string> = {
  tshirt: 'T-Shirt',
  'graphic-tee': 'Graphic Tee',
  'long-sleeve': 'Long Sleeve',
  polo: 'Polo',
  'button-up': 'Button-Up',
  'dress-shirt': 'Dress Shirt',
  pants: 'Pants',
  jeans: 'Jeans',
  chinos: 'Chinos / Stretch Pants',
  'dress-pants': 'Dress Pants',
  shorts: 'Shorts',
  'dress-shorts': 'Dress Shorts',
  hoodie: 'Hoodie',
  sweatshirt: 'Sweatshirt',
  sweater: 'Sweater',
  'track-jacket': 'Track Jacket',
  fleece: 'Fleece',
  'varsity-jacket': 'Varsity Jacket',
  puffer: 'Puffer Jacket',
  overshirt: 'Overshirt',
  blazer: 'Blazer',
  sneakers: 'Sneakers',
  sandals: 'Sandals',
  socks: 'Socks',
  belt: 'Belt',
  tie: 'Tie',
  'pajama-pants': 'Pajama Pants',
  'swim-trunks': 'Swim Trunks',
};

export const FORMALITY_LABEL: Record<Formality, string> = {
  athletic: 'Athletic',
  casual: 'Casual',
  'smart-casual': 'Smart Casual',
  formal: 'Formal',
};

export const FORMALITY_ORDER: Record<Formality, number> = {
  athletic: 0,
  casual: 1,
  'smart-casual': 2,
  formal: 3,
};

export const FIT_LABEL: Record<Fit, string> = {
  loose: 'Loose',
  regular: 'Regular',
  tight: 'Tight / Slim',
  relaxed: 'Relaxed',
};

export const SLEEVE_LABEL: Record<Sleeve, string> = {
  sleeveless: 'Sleeveless',
  short: 'Short Sleeve',
  long: 'Long Sleeve',
  'n/a': 'N/A',
};

export const SEASON_LABEL: Record<Season, string> = {
  all: 'All Seasons',
  warm: 'Warm Weather',
  cool: 'Cool Weather',
};

export const TIER_LABEL: Record<Tier, string> = {
  S: 'S — Iconic',
  A: 'A — Great',
  B: 'B — Solid',
  C: 'C — Fine',
  D: 'D — Rough',
  F: 'F — Disaster',
};

export const ALL_CATEGORIES: Category[] = [
  'top',
  'bottom',
  'shorts',
  'outerwear',
  'shoes',
  'socks',
  'belt',
  'tie',
  'sleepwear',
  'swimwear',
];

export const ALL_FORMALITIES: Formality[] = ['athletic', 'casual', 'smart-casual', 'formal'];

export const SUBCATEGORIES_BY_CATEGORY: Record<Category, Subcategory[]> = {
  top: ['tshirt', 'graphic-tee', 'long-sleeve', 'polo', 'button-up', 'dress-shirt'],
  bottom: ['pants', 'jeans', 'chinos', 'dress-pants'],
  shorts: ['shorts', 'dress-shorts'],
  outerwear: ['hoodie', 'sweatshirt', 'sweater', 'track-jacket', 'fleece', 'varsity-jacket', 'puffer', 'overshirt', 'blazer'],
  shoes: ['sneakers', 'sandals'],
  socks: ['socks'],
  belt: ['belt'],
  tie: ['tie'],
  sleepwear: ['pajama-pants'],
  swimwear: ['swim-trunks'],
};
