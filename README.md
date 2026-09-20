# Closet Chooser

An iPhone app for cataloging your wardrobe, generating outfits, and tracking what you wear — with optional Google Gemini AI for photo-based clothing recognition and S–F tier outfit grading.

Built with [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/) (React Native + TypeScript), so it runs on your actual iPhone via the Expo Go app with no Mac required, and can later be built into a standalone App Store build with [EAS Build](https://docs.expo.dev/build/introduction/).

## What it does

- **Closet** — your full wardrobe (pre-loaded with 105 items from your list, organized by category: tops, pants, shorts, outerwear, shoes, socks, belts, ties, sleepwear, swimwear). Search, filter, add new items with a photo, edit or delete anything, mark favorites.
- **Generate** — an outfit-generation engine that scores candidate outfits on formality consistency, color coordination, and pattern clashing. Ask for:
  - A good outfit, a random one, or (on purpose) a terrible one.
  - A specific formality (athletic / casual / smart casual / formal).
  - A specific pants/shorts or top color.
  - An outfit built around a specific item you pick.
  - Something you haven't worn in N+ days.
- **Evaluate** — take a photo of an outfit you're wearing. If you've added a Gemini API key, it's sent to Gemini for an "AI Overview"-style S–F tier rating with reasoning and an attempt to match which closet items you're wearing. Without a key (or if the AI call fails), it falls back to the same local scoring engine using items you tag manually.
- **History** — every outfit you've generated, evaluated, or worn is logged with its tier and date. A "Due for a rewear" strip surfaces items you haven't worn in the longest.
- **Settings** — add your own Gemini API key, toggle AI evaluation, set whether you prefer pants over shorts, and reset the wardrobe back to the starter list if needed.

## Running it on your iPhone

1. Install dependencies (already done in this repo, but if you clone it fresh):
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npx expo start
   ```
3. Install **Expo Go** from the App Store on your iPhone, then scan the QR code shown in your terminal. The app opens live on your phone — edits you make to the code hot-reload instantly.

No Mac or Xcode is required for this. When you're ready to publish to the App Store, use [EAS Build](https://docs.expo.dev/build/introduction/) (`npx eas build --platform ios`), which builds in the cloud.

## Adding Google Gemini AI (optional but recommended)

The app's "AI Overview"-style outfit grading and photo-based clothing identification use the Gemini API directly — the same underlying model family behind Google's AI Overviews. This requires your own API key (there's no way to embed one for you, since it's tied to your Google account and billing):

1. Go to **Settings → Get a key** in the app (opens [Google AI Studio](https://aistudio.google.com/apikey)).
2. Create a free API key.
3. Paste it into the field in **Settings** and tap **Save key**.

Once saved:
- On **Add Item**, after taking/choosing a photo, tap **Identify with AI** to auto-fill name, category, colors, formality, etc.
- On **Evaluate**, taking a photo will automatically call Gemini for a tier rating and reasoning, and it will try to guess which closet items you're wearing.

Without a key, both features still work using the app's built-in rule-based styling engine — you just tag items manually on the Evaluate screen.

## How outfit scoring works

`src/engine/outfitEngine.ts` builds candidate outfits from your closet (respecting any filters/criteria you set) and scores each one 0–100 based on:

- **Formality coherence** — how consistent the pieces are (athletic/casual/smart-casual/formal).
- **Color harmony** — a color-family + explicit pairing model in `src/engine/colorCompat.ts` (neutrals pair with everything; known good/bad color pairings are hand-tuned; everything else falls back to a reasonable heuristic).
- **Pattern clash** — multiple busy graphics/prints together are penalized.
- **Season fit** — if you ask for warm/cool weather, mismatched pieces are penalized.
- **"Haven't worn in a while"** — when you ask for that specifically, items are boosted or penalized based on `lastWornAt`.

The score maps to a tier: **S** (90+), **A** (76+), **B** (60+), **C** (44+), **D** (28+), **F** (below). Asking for "a terrible outfit" biases the generator toward intentionally mismatched formality to actually produce low scores, rather than just picking the worst of otherwise-decent random outfits.

## Project structure

```
app/                      Screens (Expo Router file-based routing)
  (tabs)/                 Closet, Generate, Evaluate, History, Settings tabs
  item/new.tsx            Add a new clothing item
  item/[id].tsx           View/edit/delete an item
  outfit/[id].tsx         View/delete a logged outfit
src/
  types/                  Core data model (ClothingItem, Outfit, GenerationCriteria, ...)
  data/closetSeed.ts       Your wardrobe, transcribed and categorized
  engine/                 Outfit generation, color compatibility, tier scoring
  services/               AsyncStorage persistence, local image storage, Gemini API client
  store/                  Zustand stores for closet, outfits, and settings
  components/             Reusable UI (item cards, chips, tier badges, pickers, forms)
  constants/               Theme, category/formality labels and icons
```

Data (closet items, outfit history, settings) is stored locally on-device with AsyncStorage; photos are copied into the app's document directory. Nothing leaves your phone except the specific photo you choose to send to Gemini when using AI features.

## Editing your wardrobe

Everything from your list is in the app already, categorized with colors, formality, fit, and pattern where applicable. A few items were logged with a note asking you to fill in a detail once you photograph them (e.g. the one long-sleeve shirt with no stated color). Add a photo and tweak any field any time from the item's detail screen — nothing is fixed after the initial import, and **Settings → Reset wardrobe to starter list** brings back this original set if you ever want to start over (this replaces your current closet, so use it deliberately).
