// Renders the iOS PWA launch screens into `public/splash/`, one PNG per device in
// `ios-splash-devices.mjs`. The artwork mirrors the first frame of the in-app SplashOverlay
// — the navy → action-blue → light-blue ground with the PalaceThreshold mark centered — so
// the OS launch image hands off seamlessly to the animated splash with no white flash.
//
//   npm run generate:ios-splash
//
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { BRAND, markGroup } from './brand-mark.mjs'
import { iosSplashDevices, ORIENTATIONS, physical, splashHref, splashMedia } from './ios-splash-devices.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'public/splash')
const INDEX = resolve(ROOT, 'index.html')

function svg(pw, ph) {
  const mark = Math.round(Math.min(pw, ph) * 0.4)
  const mx = Math.round((pw - mark) / 2)
  const my = Math.round((ph - mark) / 2)
  const aura = Math.round(mark * 1.7)
  const ax = Math.round((pw - aura) / 2)
  const ay = Math.round((ph - aura) / 2)
  // Ground matched to SplashOverlay's `from-primary via-accent to-secondary`.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="0 0 ${pw} ${ph}">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BRAND.navy}"/>
      <stop offset="0.5" stop-color="${BRAND.action}"/>
      <stop offset="1" stop-color="${BRAND.sky}"/>
    </linearGradient>
    <radialGradient id="aura" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${BRAND.sky}" stop-opacity="0.45"/>
      <stop offset="0.6" stop-color="${BRAND.sky}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${pw}" height="${ph}" fill="url(#ground)"/>
  <rect x="${ax}" y="${ay}" width="${aura}" height="${aura}" fill="url(#aura)"/>
  <svg x="${mx}" y="${my}" width="${mark}" height="${mark}" viewBox="0 0 200 200">
    ${markGroup({ stroke: BRAND.sky, strokeWidth: 3, locusR: 7 })}
  </svg>
</svg>`
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

const written = new Set()
const tags = []
for (const device of iosSplashDevices) {
  for (const orientation of ORIENTATIONS) {
    const { pw, ph } = physical(device, orientation)
    const file = `apple-splash-${pw}x${ph}.png`
    if (!written.has(file)) {
      written.add(file)
      await writeFile(resolve(OUT, file), new Resvg(svg(pw, ph)).render().asPng())
    }
    tags.push(
      `    <link\n` +
        `      rel="apple-touch-startup-image"\n` +
        `      media="${splashMedia(device, orientation)}"\n` +
        `      href="${splashHref(device, orientation)}"\n` +
        `    />`,
    )
  }
}

// Materialise the <link> tags statically into index.html between the markers, so they are
// always present in the served HTML (no build-time injection to depend on).
const [START, END] = ['<!-- ios-splash:start -->', '<!-- ios-splash:end -->']
const html = await readFile(INDEX, 'utf8')
const block = `${START}\n${tags.join('\n')}\n    ${END}`
await writeFile(INDEX, html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block))

console.log(`${written.size} launch images → public/splash/ · ${tags.length} <link> tags → index.html`)
