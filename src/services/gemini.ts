import { ALL_CATEGORIES, ALL_FORMALITIES } from '@/src/constants/categories';
import type { Category, ClothingItem, Fit, Formality, Season, Sleeve, Subcategory, Tier } from '@/src/types';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const VALID_TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D', 'F'];
const VALID_FITS: Fit[] = ['loose', 'regular', 'tight', 'relaxed'];
const VALID_SLEEVES: Sleeve[] = ['sleeveless', 'short', 'long', 'n/a'];
const VALID_SEASONS: Season[] = ['all', 'warm', 'cool'];

export class GeminiError extends Error {}

function endpointFor(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

function extractJson(text: string): any {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new GeminiError('No JSON object found in AI response.');
  return JSON.parse(candidate.slice(start, end + 1));
}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  image: { base64: string; mimeType: string }
): Promise<any> {
  const res = await fetch(endpointFor(model, apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }, { inline_data: { mime_type: image.mimeType, data: image.base64 } }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new GeminiError(`Gemini request failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    throw new GeminiError('Gemini response did not contain any text.');
  }
  return extractJson(text);
}

export interface IdentifiedClothing {
  name: string;
  category: Category;
  subcategory: Subcategory;
  colors: string[];
  formality: Formality;
  fit?: Fit;
  sleeve?: Sleeve;
  season?: Season;
  pattern?: string;
  brand?: string;
}

export async function identifyClothingItem(
  apiKey: string,
  image: { base64: string; mimeType: string },
  model = DEFAULT_MODEL
): Promise<IdentifiedClothing> {
  const prompt = `You are a fashion cataloging assistant. Look at the photo of a single clothing item and identify it.
Respond with ONLY a JSON object, no prose, matching exactly this shape:
{
  "name": string (short descriptive name, e.g. "Black Batman graphic tee"),
  "category": one of ${JSON.stringify(ALL_CATEGORIES)},
  "subcategory": a short kebab-case subcategory like "tshirt", "graphic-tee", "polo", "button-up", "dress-shirt", "long-sleeve", "pants", "jeans", "chinos", "dress-pants", "shorts", "dress-shorts", "hoodie", "sweatshirt", "sweater", "track-jacket", "fleece", "varsity-jacket", "puffer", "overshirt", "blazer", "sneakers", "sandals", "socks", "belt", "tie", "pajama-pants", "swim-trunks",
  "colors": array of 1-3 lowercase kebab-case color names, most dominant first (e.g. ["black", "white"]),
  "formality": one of ${JSON.stringify(ALL_FORMALITIES)},
  "fit": one of "loose", "regular", "tight", "relaxed" (omit if unclear),
  "sleeve": one of "sleeveless", "short", "long", "n/a",
  "season": one of "all", "warm", "cool",
  "pattern": short description of any print/graphic/pattern, or omit if solid color,
  "brand": brand name if a logo/label is visible, or omit
}`;

  const parsed = await callGemini(apiKey, model, prompt, image);
  if (typeof parsed?.name !== 'string' || !ALL_CATEGORIES.includes(parsed.category)) {
    throw new GeminiError('AI response was missing a usable name or category.');
  }
  return {
    name: parsed.name,
    category: parsed.category,
    subcategory: typeof parsed.subcategory === 'string' && parsed.subcategory ? parsed.subcategory : 'tshirt',
    colors: Array.isArray(parsed.colors) ? parsed.colors.filter((c: unknown) => typeof c === 'string') : [],
    formality: ALL_FORMALITIES.includes(parsed.formality) ? parsed.formality : 'casual',
    fit: VALID_FITS.includes(parsed.fit) ? parsed.fit : undefined,
    sleeve: VALID_SLEEVES.includes(parsed.sleeve) ? parsed.sleeve : undefined,
    season: VALID_SEASONS.includes(parsed.season) ? parsed.season : undefined,
    pattern: typeof parsed.pattern === 'string' ? parsed.pattern : undefined,
    brand: typeof parsed.brand === 'string' ? parsed.brand : undefined,
  };
}

export interface OutfitEvaluation {
  tier: Tier;
  pros: string[];
  cons: string[];
  matchedItemIds: string[];
}

function sanitizeStringArray(value: unknown, fallback: string): string[] {
  const arr = Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0) : [];
  return arr.length ? arr : [fallback];
}

export async function evaluateOutfitPhoto(
  apiKey: string,
  image: { base64: string; mimeType: string },
  closet: ClothingItem[],
  model = DEFAULT_MODEL
): Promise<OutfitEvaluation> {
  const closetSummary = closet
    .filter((i) => !i.archived)
    .map((i) => `${i.id}: ${i.name} (${i.category}, ${i.colors.join('/')})`)
    .join('\n');

  const prompt = `You are a sharp, honest fashion stylist giving an outfit an "AI Overview" style rating, like a tier list from S (best) to F (worst). Don't be a pushover — most outfits are B/C tier; reserve S/A for genuinely well put-together fits and D/F for real mistakes (clashing colors, mismatched formality, too many competing patterns).
Look at the photo of the outfit being worn and evaluate it on fit, color coordination, formality consistency, and overall style.
Here is the person's known wardrobe, as "id: name (category, colors)" — try to match which of these items appear in the photo:
${closetSummary || '(no catalogued items available)'}

Respond with ONLY a JSON object, no prose, matching exactly this shape:
{
  "tier": one of "S", "A", "B", "C", "D", "F",
  "pros": array of 1-4 short, specific strings praising what's working (be specific: name colors/pieces, don't just say "looks good"),
  "cons": array of 1-4 short, specific strings on what's not working or could improve (if truly nothing, a single string saying so is fine),
  "matchedItemIds": array of ids from the wardrobe list above that appear to be worn in the photo (best guess, can be empty)
}`;

  const parsed = await callGemini(apiKey, model, prompt, image);
  if (!VALID_TIERS.includes(parsed?.tier)) {
    throw new GeminiError('AI response was missing a usable tier.');
  }
  return {
    tier: parsed.tier,
    pros: sanitizeStringArray(parsed.pros, 'Nothing offensive here.'),
    cons: sanitizeStringArray(parsed.cons, 'No real weaknesses spotted.'),
    matchedItemIds: Array.isArray(parsed.matchedItemIds)
      ? parsed.matchedItemIds.filter((id: unknown) => typeof id === 'string')
      : [],
  };
}

export interface OutfitNarrative {
  pros: string[];
  cons: string[];
  verdict: string;
}

/**
 * A lighter, text-only counterpart to evaluateOutfitPhoto: no image, just the
 * item list plus the deterministic tier already computed, for a second-opinion
 * narrative without a full vision call on every single generated outfit.
 */
export async function evaluateOutfitText(
  apiKey: string,
  items: ClothingItem[],
  localTier: Tier,
  model = DEFAULT_MODEL
): Promise<OutfitNarrative> {
  const itemList = items
    .map((i) => `- ${i.name} (${i.category}, colors: ${i.colors.join('/')}, formality: ${i.formality}${i.pattern ? `, pattern: ${i.pattern}` : ''})`)
    .join('\n');

  const prompt = `You are a sharp, honest fashion stylist. A rule-based scoring system already rated this outfit as tier "${localTier}" (S best, F worst). Give a second opinion.
Outfit pieces:
${itemList}

Respond with ONLY a JSON object, no prose, matching exactly this shape:
{
  "pros": array of 1-4 short, specific strings praising what's working,
  "cons": array of 1-4 short, specific strings on what's not working or could improve,
  "verdict": one short sentence saying whether you agree with the "${localTier}" tier and why
}`;

  const res = await fetch(endpointFor(model, apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new GeminiError(`Gemini request failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    throw new GeminiError('Gemini response did not contain any text.');
  }
  const parsed = extractJson(text);

  return {
    pros: sanitizeStringArray(parsed.pros, 'Nothing offensive here.'),
    cons: sanitizeStringArray(parsed.cons, 'No real weaknesses spotted.'),
    verdict: typeof parsed.verdict === 'string' && parsed.verdict.trim() ? parsed.verdict : `Roughly agrees with the ${localTier} tier.`,
  };
}
