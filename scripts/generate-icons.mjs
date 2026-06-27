// Renders the production app-icon set from one composition: the PalaceThreshold mark on a
// drenched-navy ground, a sky aura behind the doorway, and a white spark on the locus (the
// "earned delight" — memory igniting). Output framing differs per platform:
//
//   apple-touch-icon.png  full-bleed square   (iOS applies its own rounded mask)
//   pwa-192 / pwa-512     rounded square      ("any" purpose; shown unmasked)
//   maskable-512          full-bleed, inset   (Android masks it; mark kept in the safe zone)
//   favicon.svg           rounded square      (bold, simplified mark for tiny tab sizes)
//
//   npm run generate:icons
//
import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { BRAND, markGroup } from './brand-mark.mjs'

const PUBLIC = resolve(dirname(fileURLToPath(import.meta.url)), '../public')

function iconSvg(size, { radius = 0, markScale = 0.52, strokeWidth = 7, locusR = 9 } = {}) {
  const mark = Math.round(size * markScale)
  const offset = (size - mark) / 2
  const locusY = offset + (138 / 200) * mark // the doorway/locus, in icon space
  const aura = size * 0.64
  const spark = mark * 0.34
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BRAND.navyLight}"/>
      <stop offset="0.55" stop-color="${BRAND.navy}"/>
      <stop offset="1" stop-color="${BRAND.navyDeep}"/>
    </linearGradient>
    <radialGradient id="sheen" cx="0.5" cy="0" r="0.85">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.12"/>
      <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="aura" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${BRAND.sky}" stop-opacity="0.55"/>
      <stop offset="0.6" stop-color="${BRAND.sky}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="spark" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#ground)"/>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#sheen)"/>
  <rect x="${(size - aura) / 2}" y="${locusY - aura / 2}" width="${aura}" height="${aura}" fill="url(#aura)"/>
  <svg x="${offset}" y="${offset}" width="${mark}" height="${mark}" viewBox="0 0 200 200">
    ${markGroup({ stroke: BRAND.sky, strokeWidth, locusR })}
  </svg>
  <rect x="${size / 2 - spark / 2}" y="${locusY - spark / 2}" width="${spark}" height="${spark}" fill="url(#spark)"/>
</svg>`
}

function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BRAND.navyLight}"/>
      <stop offset="0.55" stop-color="${BRAND.navy}"/>
      <stop offset="1" stop-color="${BRAND.navyDeep}"/>
    </linearGradient>
    <radialGradient id="a" cx="0.5" cy="0.62" r="0.5">
      <stop offset="0" stop-color="${BRAND.sky}" stop-opacity="0.5"/>
      <stop offset="0.6" stop-color="${BRAND.sky}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  <rect width="64" height="64" rx="14" fill="url(#a)"/>
  <svg x="13" y="13" width="38" height="38" viewBox="0 0 200 200">
    ${markGroup({ stroke: BRAND.sky, strokeWidth: 12, locusR: 11, simplified: true })}
  </svg>
</svg>`
}

const ROUNDED = (size) => Math.round(size * 0.22) // iOS-style squircle approximation

const icons = [
  { name: 'apple-touch-icon.png', size: 180, opts: { radius: 0, markScale: 0.52 } },
  { name: 'pwa-192x192.png', size: 192, opts: { radius: ROUNDED(192), markScale: 0.52 } },
  { name: 'pwa-512x512.png', size: 512, opts: { radius: ROUNDED(512), markScale: 0.52 } },
  { name: 'maskable-512x512.png', size: 512, opts: { radius: 0, markScale: 0.44 } },
]

for (const { name, size, opts } of icons) {
  const png = new Resvg(iconSvg(size, opts)).render().asPng()
  await writeFile(resolve(PUBLIC, name), png)
  console.log(`✓ ${name}  ${size}×${size}`)
}

await writeFile(resolve(PUBLIC, 'favicon.svg'), `${faviconSvg()}\n`)
console.log('✓ favicon.svg')
