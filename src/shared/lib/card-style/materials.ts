import type { CardFontId } from './ids'

/**
 * Self-hosted faces, not generic families. `ui-rounded` resolves to a real typeface on Apple and to
 * nothing anywhere else, and `ui-serif` falls through to whatever the device calls a serif — so
 * "Rounded" and "Serif" used to mean something different on every phone that opened the deck. The
 * three added faces are declared in `styles/fonts.css` and shipped with the app, because a card
 * font that needs the network is a card font that disappears offline.
 *
 * `mono` is the exception that keeps its stack: every platform has a real monospace and they all
 * look alike, so a 100 KB download would buy nothing.
 */
export const FONTS: Record<CardFontId, string> = {
  default: '"Lexend Variable", system-ui, -apple-system, "Segoe UI", sans-serif',
  serif: '"Literata Variable", ui-serif, Georgia, serif',
  rounded: '"Nunito Variable", ui-rounded, system-ui, sans-serif',
  hand: '"Caveat Variable", ui-rounded, cursive',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
}

/**
 * A texture drawn by the browser rather than shipped — an inline SVG costs nothing to download.
 * Every one below is one filtered rect; they differ only in size and in what the filter does.
 *
 * `stitchTiles="stitch"` on every generator whose noise is slow enough to see across a tile: the
 * default leaves turbulence free to disagree with itself at the tile boundary, which on a scene
 * that repeats is a grid of seams — visible on the contour map at 320px long before any of this.
 * It costs nothing and the grain, whose specks are smaller than the seam, does not need it.
 */
function texture(size: number, filter: string, opacity: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><filter id="f">${filter}</filter><rect width="${size}" height="${size}" filter="url(#f)" opacity="${opacity}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/** Fibrous noise, for the tooth of a printed surface. */
export function grain(opacity: number, frequency: string): string {
  return texture(
    120,
    `<feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="3"/>`,
    opacity,
  )
}

/**
 * Contour lines: low-frequency noise pushed through an alternating alpha ramp, which bands the
 * smooth field into the closed rings of a survey map.
 */
export function contour(opacity: number): string {
  return texture(
    320,
    '<feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="4" seed="7" stitchTiles="stitch"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0.42 0 0 0 0 0.28 0 0 0 0 0.11 1 0 0 0 0"/>' +
      '<feComponentTransfer><feFuncA type="discrete" tableValues="0 0 0 1 0 0 0 1 0 0 0 1"/></feComponentTransfer>',
    opacity,
  )
}

/** High-frequency noise clipped hard, so only the brightest specks survive as stars. */
export function stars(opacity: number): string {
  return texture(
    240,
    '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 -0.74"/>',
    opacity,
  )
}

/**
 * Soft white masses: low-frequency noise, wider than it is tall, pushed through an inverted alpha
 * ramp so the smooth middle of the field drops out and only the crests stay opaque.
 */
export function clouds(opacity: number): string {
  return texture(
    420,
    '<feTurbulence type="fractalNoise" baseFrequency="0.008 0.016" numOctaves="5" seed="11" stitchTiles="stitch"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -1.35 0 0 0 1.02"/>',
    opacity,
  )
}

/**
 * Blades: the same noise with the axes pulled apart — fast across, slow down — which stretches every
 * speck into a vertical streak the length of a stalk.
 */
export function blades(opacity: number): string {
  return texture(
    200,
    '<feTurbulence type="fractalNoise" baseFrequency="0.62 0.014" numOctaves="3" seed="5" stitchTiles="stitch"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0.16 0 0 0 0 0.3 0 0 0 0 0.1 1.15 0 0 0 -0.34"/>',
    opacity,
  )
}

/** Marble veining: wide noise blurred back down, so the bright ridges read as wisps and not grit. */
export function veins(opacity: number): string {
  return texture(
    360,
    '<feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="5" seed="13" stitchTiles="stitch"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 -0.56"/>' +
      '<feGaussianBlur stdDeviation="0.7"/>',
    opacity,
  )
}

/** Cork: mid-frequency noise kept coarse, so the flecks stay the size of pressed granules. */
export function granules(opacity: number): string {
  return texture(
    150,
    '<feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="4" seed="9"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0.33 0 0 0 0 0.21 0 0 0 0 0.1 1.5 0 0 0 -0.52"/>',
    opacity,
  )
}

/**
 * The rule spacing of a ruled pad — the real thing is about 7mm, and it does not consult your
 * handwriting. This was briefly `calc(var(--card-style-size) * 1.375)` on the theory that the rules
 * could sit under the words, and the theory was wrong: only the style page's preview paints its text
 * at `--card-style-size`. `CardFace` sets its own (`text-card-prompt leading-[1.15]`,
 * `text-card-answer leading-relaxed`), so in the study session — where a card is actually read — the
 * rules drifted straight through the words, and the thumbnails were off by their own padding. A
 * fixed rhythm is both honest about the material and the same on all three.
 */
export const RULE_SPACING = '28px'
