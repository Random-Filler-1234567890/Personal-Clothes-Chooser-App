export type Category =
  | 'top'
  | 'bottom'
  | 'shorts'
  | 'outerwear'
  | 'shoes'
  | 'socks'
  | 'belt'
  | 'tie'
  | 'sleepwear'
  | 'swimwear';

export type Subcategory =
  | 'tshirt'
  | 'graphic-tee'
  | 'long-sleeve'
  | 'polo'
  | 'button-up'
  | 'dress-shirt'
  | 'pants'
  | 'jeans'
  | 'chinos'
  | 'dress-pants'
  | 'shorts'
  | 'dress-shorts'
  | 'hoodie'
  | 'sweatshirt'
  | 'sweater'
  | 'track-jacket'
  | 'fleece'
  | 'varsity-jacket'
  | 'puffer'
  | 'overshirt'
  | 'blazer'
  | 'sneakers'
  | 'sandals'
  | 'socks'
  | 'belt'
  | 'tie'
  | 'pajama-pants'
  | 'swim-trunks';

export type Formality = 'athletic' | 'casual' | 'smart-casual' | 'formal';

export type Fit = 'loose' | 'regular' | 'tight' | 'relaxed';

export type Sleeve = 'sleeveless' | 'short' | 'long' | 'n/a';

export type Season = 'all' | 'warm' | 'cool';

export interface ClothingItem {
  id: string;
  name: string;
  category: Category;
  subcategory: Subcategory;
  colors: string[];
  pattern?: string;
  brand?: string;
  formality: Formality;
  fit?: Fit;
  sleeve?: Sleeve;
  season: Season;
  imageUri?: string;
  notes?: string;
  favorite: boolean;
  archived: boolean;
  createdAt: string;
  lastWornAt?: string;
  wearCount: number;
  /** How many identical physical copies you own (plain black tee x5, etc). Defaults to 1. */
  quantity?: number;
}

export type NewClothingItem = Omit<
  ClothingItem,
  'id' | 'createdAt' | 'wearCount' | 'favorite' | 'archived'
> &
  Partial<Pick<ClothingItem, 'favorite' | 'archived'>>;

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface Outfit {
  id: string;
  itemIds: string[];
  tier?: Tier;
  score?: number;
  tierReasoning?: string;
  tierPros?: string[];
  tierCons?: string[];
  vibeTags?: string[];
  aiEvaluated: boolean;
  photoUri?: string;
  createdAt: string;
  wornOn?: string;
  name?: string;
  source: 'generated' | 'manual' | 'photo';
}

export interface GenerationCriteria {
  formality?: Formality;
  mustIncludeItemIds?: string[];
  mustIncludeColors?: string[];
  excludeItemIds?: string[];
  restrictCategory?: Partial<Record<Category, string[]>>;
  unwornForDays?: number;
  quality: 'good' | 'bad' | 'random';
  count: number;
  season?: Season;
}

export interface GeneratedOutfit {
  itemIds: string[];
  score: number;
  tier: Tier;
  pros: string[];
  cons: string[];
  vibeTags: string[];
}

export type SockPreference = 'random' | 'white' | 'black';

/** How the written feedback talks about a fit's overall character. Purely a word-choice
 * preference — never gates which items or combinations the engine will pick. */
export type StyleLeaning = 'masculine' | 'feminine' | 'neutral' | 'none';

/** Manually self-reported, since reliably auto-detecting this from a photo isn't something
 * this app does — used only to add an occasional contextual color-harmony note. */
export type ColorUndertone = 'warm' | 'cool' | 'neutral' | 'unknown';

/** Nudges outfit generation toward/away from patterned or attention-grabbing pieces. */
export type BoldnessPreference = 'bold' | 'balanced' | 'subtle';

export interface AppSettings {
  geminiApiKey?: string;
  preferPants: boolean;
  useAiEvaluation: boolean;
  sockPreference: SockPreference;
  styleLeaning: StyleLeaning;
  colorUndertone: ColorUndertone;
  boldness: BoldnessPreference;
}
