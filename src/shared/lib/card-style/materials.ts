import type { CardFontId } from './ids'

export const FONTS: Record<CardFontId, string> = {
  default: '"Lexend Variable", system-ui, -apple-system, "Segoe UI", sans-serif',
  serif: '"Literata Variable", ui-serif, Georgia, serif',
  rounded: '"Nunito Variable", ui-rounded, system-ui, sans-serif',
  hand: '"Caveat Variable", ui-rounded, cursive',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
}

function texture(size: number, filter: string, opacity: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><filter id="f">${filter}</filter><rect width="${size}" height="${size}" filter="url(#f)" opacity="${opacity}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

export function grain(opacity: number, frequency: string): string {
  return texture(
    120,
    `<feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="3"/>`,
    opacity,
  )
}

export function contour(opacity: number): string {
  return texture(
    320,
    '<feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="4" seed="7" stitchTiles="stitch"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0.42 0 0 0 0 0.28 0 0 0 0 0.11 1 0 0 0 0"/>' +
      '<feComponentTransfer><feFuncA type="discrete" tableValues="0 0 0 1 0 0 0 1 0 0 0 1"/></feComponentTransfer>',
    opacity,
  )
}

export function stars(opacity: number): string {
  return texture(
    240,
    '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 -0.74"/>',
    opacity,
  )
}

export function clouds(opacity: number): string {
  return texture(
    420,
    '<feTurbulence type="fractalNoise" baseFrequency="0.008 0.016" numOctaves="5" seed="11" stitchTiles="stitch"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -1.35 0 0 0 1.02"/>',
    opacity,
  )
}

export function blades(opacity: number): string {
  return texture(
    200,
    '<feTurbulence type="fractalNoise" baseFrequency="0.62 0.014" numOctaves="3" seed="5" stitchTiles="stitch"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0.16 0 0 0 0 0.3 0 0 0 0 0.1 1.15 0 0 0 -0.34"/>',
    opacity,
  )
}

export function veins(opacity: number): string {
  return texture(
    360,
    '<feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="5" seed="13" stitchTiles="stitch"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 -0.56"/>' +
      '<feGaussianBlur stdDeviation="0.7"/>',
    opacity,
  )
}

export function granules(opacity: number): string {
  return texture(
    150,
    '<feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="4" seed="9"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0.33 0 0 0 0 0.21 0 0 0 0 0.1 1.5 0 0 0 -0.52"/>',
    opacity,
  )
}

export const RULE_SPACING = '28px'
