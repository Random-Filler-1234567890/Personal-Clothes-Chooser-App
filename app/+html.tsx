import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Mirrors app.config.js: GitHub Pages serves this app from a /repo-name subpath, so
// every root-absolute static asset link below needs the same prefix in that build only.
const BASE_PATH = process.env.EXPO_PUBLIC_GH_PAGES === '1' ? '/Personal-Clothes-Chooser-App' : '';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <title>Closet Chooser</title>
        <meta name="description" content="Your wardrobe, outfit generator, and outfit tier tracker." />

        <link rel="manifest" href={`${BASE_PATH}/manifest.json`} />
        <meta name="theme-color" content="#C3572F" />

        {/* iOS "Add to Home Screen" standalone app behavior */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Closet" />
        <link rel="apple-touch-icon" href={`${BASE_PATH}/icon-1024.png`} />

        {/* Android / other Chromium-based "Add to Home Screen" */}
        <meta name="mobile-web-app-capable" content="yes" />

        <ScrollViewStyleReset />

        <script
          // Registers a minimal service worker so the app keeps working (from cache)
          // when opened with no network connection, once it has been loaded once.
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('${BASE_PATH}/sw.js', { scope: '${BASE_PATH}/' }).catch(function () {});
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
