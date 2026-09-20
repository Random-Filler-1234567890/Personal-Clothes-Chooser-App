import { ALL_CATEGORIES, ALL_FORMALITIES } from '@/src/constants/categories';
import type { Category, ClothingItem, Fit, Formality, Season, Sleeve, Subcategory, Tier } from '@/src/types';

const DEFAULT_MODEL = 'gemini-2.5-flash';

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
  return parsed as IdentifiedClothing;
}

export interface OutfitEvaluation {
  tier: Tier;
  reasoning: string;
  matchedItemIds: string[];
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

  const prompt = `You are a witty but genuinely knowledgeable fashion stylist giving an outfit an "AI Overview" style rating, like a tier list from S (best) to F (worst).
Look at the photo of the outfit being worn and evaluate it on fit, color coordination, formality consistency, and overall style.
Here is the person's known wardrobe, as "id: name (category, colors)" — try to match which of these items appear in the photo:
${closetSummary || '(no catalogued items available)'}

Respond with ONLY a JSON object, no prose, matching exactly this shape:
{
  "tier": one of "S", "A", "B", "C", "D", "F",
  "reasoning": a punchy 2-3 sentence explanation of the rating,
  "matchedItemIds": array of ids from the wardrobe list above that appear to be worn in the photo (best guess, can be empty)
}`;

  const parsed = await callGemini(apiKey, model, prompt, image);
  return parsed as OutfitEvaluation;
}
