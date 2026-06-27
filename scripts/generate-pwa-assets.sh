#!/usr/bin/env sh
# Regenerate the PWA icons + iOS launch screens from assets/mindscape-logo.svg with
# pwa-asset-generator. Drives a headless Chrome (override the path with PUPPETEER_EXECUTABLE_PATH).
# Writes images to public/pwa-assets/ and injects the <link> tags into index.html.
set -e
export PUPPETEER_EXECUTABLE_PATH="${PUPPETEER_EXECUTABLE_PATH:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
npx pwa-asset-generator assets/mindscape-logo.svg public/pwa-assets \
  --background "linear-gradient(135deg, #1B36B0 0%, #091A7A 55%, #05103F 100%)" \
  --index index.html \
  --path-override "/pwa-assets" \
  --type png \
  --padding "12%"
