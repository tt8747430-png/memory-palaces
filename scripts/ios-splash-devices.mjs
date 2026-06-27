// Single source of truth for the iOS PWA launch screens (`apple-touch-startup-image`).
// iOS only uses a startup image whose media query matches the device exactly, so each entry
// is one device in its natural-portrait CSS points + device-pixel-ratio. The generator
// (`scripts/generate-ios-splash.mjs`) renders a PNG per device × orientation at physical
// resolution, and the Vite plugin in `vite.config.ts` emits the matching `<link media>` tags
// from the same list — so the images and the tags can never drift.
//
// Device matrix mirrors the current Progressier set (iPhone SE → 17 Pro Max + iPhone Air,
// every iPad), both orientations: a device can cold-launch in landscape, and the app can be
// added to the Home Screen on iPad, so we cover both rather than leave a white flash there.
export const iosSplashDevices = [
  // iPhones
  { w: 320, h: 568, dpr: 2, label: 'iPhone SE (1st gen) · iPod touch' },
  { w: 375, h: 667, dpr: 2, label: 'iPhone SE (2–3) · 8 · 7 · 6s · 6' },
  { w: 375, h: 812, dpr: 3, label: 'iPhone 13/12 mini · 11 Pro · XS · X' },
  { w: 390, h: 844, dpr: 3, label: 'iPhone 16e · 14 · 13 Pro · 13 · 12 Pro · 12' },
  { w: 393, h: 852, dpr: 3, label: 'iPhone 16 · 15 Pro · 15 · 14 Pro' },
  { w: 402, h: 874, dpr: 3, label: 'iPhone 17 Pro · 17 · 16 Pro' },
  { w: 414, h: 736, dpr: 3, label: 'iPhone 8/7/6s/6 Plus' },
  { w: 414, h: 896, dpr: 2, label: 'iPhone 11 · XR' },
  { w: 414, h: 896, dpr: 3, label: 'iPhone 11 Pro Max · XS Max' },
  { w: 420, h: 912, dpr: 3, label: 'iPhone Air' },
  { w: 428, h: 926, dpr: 3, label: 'iPhone 14 Plus · 13/12 Pro Max' },
  { w: 430, h: 932, dpr: 3, label: 'iPhone 16 Plus · 15 Pro Max · 15 Plus · 14 Pro Max' },
  { w: 440, h: 956, dpr: 3, label: 'iPhone 17 Pro Max · 16 Pro Max' },
  // iPads
  { w: 744, h: 1133, dpr: 2, label: '8.3" iPad Mini' },
  { w: 768, h: 1024, dpr: 2, label: '9.7" iPad · iPad Pro · mini · Air' },
  { w: 810, h: 1080, dpr: 2, label: '10.2" iPad' },
  { w: 820, h: 1180, dpr: 2, label: '10.9" iPad Air' },
  { w: 834, h: 1112, dpr: 2, label: '10.5" iPad Air' },
  { w: 834, h: 1194, dpr: 2, label: '11" iPad Pro · 10.5" iPad Pro' },
  { w: 834, h: 1210, dpr: 2, label: '11" iPad Pro (M4)' },
  { w: 1024, h: 1366, dpr: 2, label: '12.9" iPad Pro' },
  { w: 1032, h: 1376, dpr: 2, label: '13" iPad Pro (M4)' },
]

export const ORIENTATIONS = /** @type {const} */ (['portrait', 'landscape'])

/** Physical-pixel resolution the PNG is rendered at (long edge runs vertical in portrait). */
export function physical({ w, h, dpr }, orientation) {
  const [short, long] = [w * dpr, h * dpr]
  return orientation === 'landscape' ? { pw: long, ph: short } : { pw: short, ph: long }
}

/** The media query iOS matches a startup image against (device-width/height are the device's
 *  natural-portrait values for BOTH orientations; only `orientation` differs). */
export function splashMedia({ w, h, dpr }, orientation) {
  return (
    `screen and (device-width: ${w}px) and (device-height: ${h}px) and ` +
    `(-webkit-device-pixel-ratio: ${dpr}) and (orientation: ${orientation})`
  )
}

/** Public path of a device's launch image. */
export function splashHref(device, orientation) {
  const { pw, ph } = physical(device, orientation)
  return `/splash/apple-splash-${pw}x${ph}.png`
}
