/**
 * The mark as SVG text, for everything drawn before React runs: the icons, the iOS launch screens,
 * and the page the browser paints while the app loads. `Threshold` draws the same `MARK` in the app.
 */
import {
  archPath,
  type Bar,
  MARK,
  MARK_BOX,
  MARK_PAINT,
  pedimentPath,
  type RadialPaint,
  SPLASH_MARK_PX,
  type Stop,
  TILE_BOX,
  TILE_PAINT,
} from '../../src/shared/config/brand-mark.ts'
import { STATUS_BAR } from '../../src/shared/config/status-bar.ts'
import type { LaunchScreen } from './launch-screens.ts'

const stops = (list: readonly Stop[]) =>
  list
    .map(
      ([offset, color, opacity]) =>
        `<stop offset="${offset}" stop-color="${color}"${opacity === undefined ? '' : ` stop-opacity="${opacity}"`}/>`,
    )
    .join('')

const radial = (id: string, { cx, cy, r, stops: list }: RadialPaint) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse">${stops(list)}</radialGradient>`

const bar = ({ x, y, width, height, rx }: Bar, fill: string) =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" fill="${fill}"/>`

/** The mark in its 200-unit box. `id` keeps its paint apart from another mark's on the page. */
export function markSvg(id: string): string {
  const { pediment, beam, capitals, columns, door, steps } = MARK
  const { stone, glow, light } = MARK_PAINT
  return [
    '<defs>',
    radial(`${id}-glow`, glow),
    radial(`${id}-light`, light),
    '</defs>',
    `<circle cx="${glow.cx}" cy="${glow.cy}" r="${glow.r}" fill="url(#${id}-glow)"/>`,
    `<path d="${pedimentPath(pediment)}" fill="${stone}" stroke="${stone}" stroke-width="${pediment.round}" stroke-linejoin="round"/>`,
    bar(beam, stone),
    ...capitals.map((capital) => bar(capital, stone)),
    ...columns.map((column) => bar(column, stone)),
    `<path d="${archPath(door)}" fill="url(#${id}-light)"/>`,
    ...steps.map((step) => bar(step, stone)),
  ].join('')
}

/**
 * The superellipse an app icon is cut to — the continuous corner iOS draws, not a rounded square's
 * quarter circles.
 */
function squirclePath(size: number, exponent = 5, points = 240): string {
  const half = size / 2
  const coords = Array.from({ length: points }, (_, index) => {
    const angle = (index / points) * Math.PI * 2
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const x = half + half * Math.sign(cos) * Math.abs(cos) ** (2 / exponent)
    const y = half + half * Math.sign(sin) * Math.abs(sin) ** (2 / exponent)
    return `${x.toFixed(1)} ${y.toFixed(1)}`
  })
  return `M${coords.join('L')}Z`
}

export interface TileOptions {
  /**
   * `square` fills the canvas — iOS and Android cut their own shape from it. `squircle` is cut here,
   * for the places that show an icon as it is: a browser tab, a desktop, the sign-in screen.
   */
  shape: 'square' | 'squircle'
  /** The mark's width as a share of the tile. A maskable icon keeps it inside the safe circle. */
  markWidth: number
  /** Pixel size, when the SVG wants an intrinsic one. */
  size?: number
}

/** The mark's widest part, the lower step: what `markWidth` measures. */
const MARK_SPAN = MARK.steps[1].width

export function tileSvg({ shape, markWidth, size }: TileOptions): string {
  const scale = (markWidth * TILE_BOX) / MARK_SPAN
  const clip = shape === 'squircle' ? squirclePath(TILE_BOX) : null
  const attrs = size === undefined ? '' : ` width="${size}" height="${size}"`
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE_BOX} ${TILE_BOX}"${attrs}>`,
    '<title>Mindscape</title>',
    '<defs>',
    `<linearGradient id="tile-ground" x1="0" y1="0" x2="0" y2="1">${stops(TILE_PAINT.ground)}</linearGradient>`,
    radial('tile-bloom', TILE_PAINT.bloom),
    clip ? `<clipPath id="tile-shape"><path d="${clip}"/></clipPath>` : '',
    '</defs>',
    clip ? '<g clip-path="url(#tile-shape)">' : '<g>',
    `<rect width="${TILE_BOX}" height="${TILE_BOX}" fill="url(#tile-ground)"/>`,
    `<rect width="${TILE_BOX}" height="${TILE_BOX}" fill="url(#tile-bloom)"/>`,
    `<g transform="translate(${TILE_BOX / 2} ${TILE_BOX / 2}) scale(${scale.toFixed(4)}) translate(${-MARK_BOX / 2} ${-MARK_BOX / 2})">`,
    markSvg('tile-mark'),
    '</g></g></svg>',
  ].join('')
}

/** The mark alone, sized by its page — the frame the browser paints while the app loads. */
export function bootMarkSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_BOX} ${MARK_BOX}" aria-hidden="true">${markSvg('boot-mark')}</svg>`
}

/** One launch screen at device pixels: the chrome colour, and the mark where the splash draws it. */
export function launchScreenSvg(screen: LaunchScreen): string {
  const { width, height, ratio, statusBar, theme } = screen
  const pxWidth = width * ratio
  const pxHeight = height * ratio
  const centerX = (width / 2) * ratio
  const centerY = (statusBar + (height - statusBar) / 2) * ratio
  const unit = (SPLASH_MARK_PX / MARK_BOX) * ratio
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pxWidth}" height="${pxHeight}" viewBox="0 0 ${pxWidth} ${pxHeight}">`,
    `<rect width="${pxWidth}" height="${pxHeight}" fill="${STATUS_BAR[theme]}"/>`,
    `<g transform="translate(${centerX} ${centerY}) scale(${unit}) translate(${-MARK_BOX / 2} ${-MARK_BOX / 2})">`,
    markSvg('launch-mark'),
    '</g></svg>',
  ].join('')
}
