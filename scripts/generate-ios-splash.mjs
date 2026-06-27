// Renders the iOS PWA launch screens into `public/splash/`, one PNG per device in
// `ios-splash-devices.mjs`. The artwork mirrors the first frame of the in-app SplashOverlay
// — the navy → action-blue → light-blue ground with the PalaceThreshold mark centered — so
// the OS launch image hands off seamlessly to the animated splash with no white flash.
//
//   npm run generate:ios-splash
//
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { iosSplashDevices, physical } from './ios-splash-devices.mjs'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/splash')

// Brand stops, matched to SplashOverlay's `from-primary via-accent to-secondary`.
const NAVY = '#091A7A'
const ACTION = '#4F8EFF'
const SKY = '#ADC8FF'

// The PalaceThreshold mark (viewBox 0 0 200 200), drenched tone: light-blue lines, white
// locus. Kept in sync with src/widgets/palace-threshold/ui/PalaceThreshold.tsx.
const MARK = `
    <g fill="none" stroke="${SKY}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M40 64 L100 24 L160 64"/>
      <line x1="46" y1="64" x2="154" y2="64"/>
      <line x1="64" y1="64" x2="64" y2="166"/>
      <line x1="136" y1="64" x2="136" y2="166"/>
      <path d="M86 166 L86 126 A14 14 0 0 1 114 126 L114 166"/>
      <line x1="40" y1="166" x2="160" y2="166"/>
      <line x1="28" y1="178" x2="172" y2="178"/>
    </g>
    <circle cx="100" cy="138" r="7" fill="#FFFFFF"/>`

function svg(pw, ph) {
  const mark = Math.round(Math.min(pw, ph) * 0.4)
  const mx = Math.round((pw - mark) / 2)
  const my = Math.round((ph - mark) / 2)
  const aura = Math.round(mark * 1.7)
  const ax = Math.round((pw - aura) / 2)
  const ay = Math.round((ph - aura) / 2)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="0 0 ${pw} ${ph}">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${NAVY}"/>
      <stop offset="0.5" stop-color="${ACTION}"/>
      <stop offset="1" stop-color="${SKY}"/>
    </linearGradient>
    <radialGradient id="aura" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${SKY}" stop-opacity="0.45"/>
      <stop offset="0.6" stop-color="${SKY}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${pw}" height="${ph}" fill="url(#ground)"/>
  <rect x="${ax}" y="${ay}" width="${aura}" height="${aura}" fill="url(#aura)"/>
  <svg x="${mx}" y="${my}" width="${mark}" height="${mark}" viewBox="0 0 200 200">${MARK}
  </svg>
</svg>`
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

for (const device of iosSplashDevices) {
  const { pw, ph } = physical(device)
  const png = new Resvg(svg(pw, ph)).render().asPng()
  await writeFile(resolve(OUT, `apple-splash-${pw}x${ph}.png`), png)
  console.log(`✓ apple-splash-${pw}x${ph}.png  ${device.label}`)
}

console.log(`\n${iosSplashDevices.length} launch images → public/splash/`)
