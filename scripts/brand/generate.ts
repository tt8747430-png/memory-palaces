/**
 * Draws every brand raster from `brand-mark.ts`: the favicon, the app icons and the iOS launch
 * screens. `npm run brand:assets` after changing the mark; the output is committed.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { LAUNCH_SCREENS } from './launch-screens.ts'
import { launchScreenSvg, type TileOptions, tileSvg } from './render.ts'

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '../../public')

/** The mark's share of the tile. A maskable icon keeps the mark inside the centre 80% circle. */
const MARK_WIDTH = 0.6
const MASKABLE_MARK_WIDTH = 0.53

function png(svg: string, width: number): Buffer {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng()
}

function write(file: string, data: string | Buffer) {
  const path = join(PUBLIC, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, data)
  console.log(`  ${file}`)
}

const icons: readonly (TileOptions & { file: string; size: number })[] = [
  { file: 'apple-touch-icon.png', shape: 'square', markWidth: MARK_WIDTH, size: 180 },
  { file: 'pwa-192x192.png', shape: 'squircle', markWidth: MARK_WIDTH, size: 192 },
  { file: 'pwa-512x512.png', shape: 'squircle', markWidth: MARK_WIDTH, size: 512 },
  { file: 'maskable-512x512.png', shape: 'square', markWidth: MASKABLE_MARK_WIDTH, size: 512 },
]

console.log('Icons')
write('favicon.svg', `${tileSvg({ shape: 'squircle', markWidth: MARK_WIDTH })}\n`)
for (const { file, ...tile } of icons) write(file, png(tileSvg(tile), tile.size))

console.log('Launch screens')
if (new Set(LAUNCH_SCREENS.map(({ file }) => file)).size !== LAUNCH_SCREENS.length) {
  throw new Error('Two launch screens share a file name.')
}
// Wholesale: a screen dropped from the list takes its images with it.
rmSync(join(PUBLIC, 'splash'), { recursive: true, force: true })
for (const screen of LAUNCH_SCREENS) {
  write(screen.file, png(launchScreenSvg(screen), screen.width * screen.ratio))
}
