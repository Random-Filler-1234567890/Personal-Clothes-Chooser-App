# Closet Chooser

An app for cataloging your wardrobe, generating outfits, and tracking what you wear — with optional Google Gemini AI for photo-based clothing recognition and S–F tier outfit grading.

Built with [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/) (React Native + TypeScript) as a single codebase that runs three ways: as a website/PWA you can add to your iPhone home screen (free, no App Store, no Mac), live in the Expo Go app during development, or later as a real standalone iOS build via EAS.

## Use it on your iPhone as a web app (recommended)

This is the easiest way to get a real, icon-on-your-home-screen experience for free:

1. Push this repo to GitHub (already done) and turn on **GitHub Pages**: on GitHub, go to **Settings → Pages** and set **Source** to **"GitHub Actions"**. That's the only manual step — a workflow (`.github/workflows/deploy-pages.yml`) is already set up to build and publish the site automatically on every push.
2. After the first push completes, your site is live at:
   `https://random-filler-1234567890.github.io/Personal-Clothes-Chooser-App/`
   (check the **Actions** tab on GitHub for build progress the first time; it takes a couple of minutes.)
3. On your iPhone, open that URL in **Safari** (must be Safari, not Chrome, for this step) → tap the **Share** button → **Add to Home Screen**.

From then on it opens full-screen with its own icon, no browser bar, exactly like a native app — and it keeps working offline once you've loaded it at least once, since it registers a small service worker that caches the app shell.

All your data (closet, outfit history, settings, and photos) is stored entirely in your phone's browser storage — nothing is sent to a server except the specific photo you choose to send to Gemini when using AI features. Photos are stored via IndexedDB in the browser on web, or the native filesystem when running as a native app.

## Running it locally / on Expo Go (for development)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npx expo start
   ```
   Press `w` to open it in a browser, or install **Expo Go** on your iPhone and scan the QR code to run it natively during development.

No Mac or Xcode is required for any of this. If you later want a real standalone App Store / TestFlight build instead of the web app, use [EAS Build](https://docs.expo.dev/build/introduction/) (`npx eas build --platform ios`), which builds in the cloud — this requires a $99/year Apple Developer account, which the web app route above avoids entirely.

## What it does

- **Home** — one tap for a full outfit pulled straight from your closet ("Get me an outfit" / "Surprise me" / "Make it bad"), plus a glance at items you haven't worn in a while.
- **Closet** — your full wardrobe (pre-loaded with 105 items from your list, organized by category). Search, filter by category or favorites, add new items with a photo, edit or delete anything.
- **Generate** — an outfit-generation engine that scores candidate outfits on formality consistency, color coordination, and pattern clashing, and shows the actual item names right on the result card (not just thumbnails). Ask for:
  - A good outfit, a random one, or (on purpose) a terrible one.
  - A specific formality (athletic / casual / smart casual / formal).
  - A specific pants/shorts or top color.
  - An outfit built around one or more specific items you pick.
  - Something you haven't worn in N+ days.
  - Tap the shuffle icon on any result card to regenerate just that one outfit.
- **Evaluate** — take a photo of an outfit you're wearing. If you've added a Gemini API key, it's sent to Gemini for an "AI Overview"-style S–F tier rating with reasoning and an attempt to match which closet items you're wearing. Without a key (or if the AI call fails), it falls back to the same local scoring engine using items you tag manually.
- **History** — every outfit you've generated, evaluated, or worn is logged with its tier and date.
- **Settings** — add your own Gemini API key, toggle AI evaluation, set whether you prefer pants over shorts, see quick stats, and reset the wardrobe back to the starter list if needed.

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
- **"Haven't worn in a while"** — when you ask for that specifically, items are boosted or penalized based on `lastWornAt`; it's shown as a note either way, but doesn't affect the fashion tier itself.

The score maps to a tier: **S** (90+), **A** (76+), **B** (60+), **C** (44+), **D** (28+), **F** (below). Asking for "a terrible outfit" actively biases the generator toward mismatched formality (and, less aggressively, clashing colors) to actually produce low scores, rather than just picking the worst of otherwise-decent random outfits.

## Project structure

```
app/                      Screens (Expo Router file-based routing)
  +html.tsx               Custom web document head (PWA meta tags, manifest, service worker)
  (tabs)/                 Home, Closet, Generate, Evaluate, History, Settings tabs
  item/new.tsx            Add a new clothing item
  item/[id].tsx           View/edit/delete an item
  outfit/[id].tsx         View/delete a logged outfit
src/
  types/                  Core data model (ClothingItem, Outfit, GenerationCriteria, ...)
  data/closetSeed.ts       Your wardrobe, transcribed and categorized
  engine/                 Outfit generation, color compatibility, tier scoring
  services/               AsyncStorage persistence, image storage (native + web/IndexedDB), Gemini API client
  hooks/useImageSource.ts Resolves a stored photo reference to something <Image> can render, per platform
  store/                  Zustand stores for closet, outfits, and settings
  components/             Reusable UI (Button, Card, item cards, chips, tier badges, pickers, forms)
  constants/               Theme, category/formality labels and icons
public/                   Static web files (manifest.json, service worker, app icon) copied as-is into the web build
.github/workflows/        GitHub Actions workflow that builds and deploys the web app to GitHub Pages
```

## Editing your wardrobe

Everything from your list is in the app already, categorized with colors, formality, fit, and pattern where applicable. A few items were logged with a note asking you to fill in a detail once you photograph them (e.g. the one long-sleeve shirt with no stated color). Add a photo and tweak any field any time from the item's detail screen — nothing is fixed after the initial import, and **Settings → Reset wardrobe to starter list** brings back this original set if you ever want to start over (this replaces your current closet, so use it deliberately).
