// Single source of truth for the iOS PWA launch screens (`apple-touch-startup-image`).
// iOS only uses a startup image whose media query matches the device exactly, so each
// entry is one iPhone in CSS points + its device-pixel-ratio. The generator
// (`scripts/generate-ios-splash.mjs`) renders one PNG per entry at physical resolution,
// and the Vite plugin in `vite.config.ts` emits the matching `<link media>` tags from the
// same list — so the images and the tags can never drift.
//
// Phone-only, portrait app (manifest `orientation: portrait`), so we ship portrait launch
// images only; a rare landscape cold-launch falls back to the boot-splash in index.html.
export const iosSplashDevices = [
  { w: 320, h: 568, dpr: 2, label: 'iPhone SE (1st gen) / 5 / 5s' },
  { w: 375, h: 667, dpr: 2, label: 'iPhone SE (2nd/3rd gen) / 6 / 7 / 8' },
  { w: 414, h: 736, dpr: 3, label: 'iPhone 6+ / 7+ / 8 Plus' },
  { w: 375, h: 812, dpr: 3, label: 'iPhone X / XS / 11 Pro' },
  { w: 414, h: 896, dpr: 2, label: 'iPhone XR / 11' },
  { w: 414, h: 896, dpr: 3, label: 'iPhone XS Max / 11 Pro Max' },
  { w: 360, h: 780, dpr: 3, label: 'iPhone 12 mini / 13 mini' },
  { w: 390, h: 844, dpr: 3, label: 'iPhone 12 / 13 / 14' },
  { w: 393, h: 852, dpr: 3, label: 'iPhone 14 Pro / 15 / 15 Pro / 16' },
  { w: 402, h: 874, dpr: 3, label: 'iPhone 16 Pro' },
  { w: 428, h: 926, dpr: 3, label: 'iPhone 12/13 Pro Max / 14 Plus' },
  { w: 430, h: 932, dpr: 3, label: 'iPhone 15 Plus / 15 Pro Max / 16 Plus' },
  { w: 440, h: 956, dpr: 3, label: 'iPhone 16 Pro Max' },
]

/** Physical-pixel resolution of a device entry (what the PNG is rendered at). */
export const physical = ({ w, h, dpr }) => ({ pw: w * dpr, ph: h * dpr })

/** The media query iOS matches a startup image against. */
export const splashMedia = ({ w, h, dpr }) =>
  `screen and (device-width: ${w}px) and (device-height: ${h}px) and ` +
  `(-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`

/** Public path of a device's launch image. */
export const splashHref = (device) => {
  const { pw, ph } = physical(device)
  return `/splash/apple-splash-${pw}x${ph}.png`
}
