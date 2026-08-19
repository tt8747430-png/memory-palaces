/**
 * A card's look, resolved once into custom properties. Preview thumbnails, the style page's live
 * card and the study card all read the same variables, so none of them can drift from the others.
 */
export const CARD_STYLE_PRESET_IDS = ['plain', 'outlined', 'chalk', 'notebook', 'paper'] as const
export type CardStylePresetId = (typeof CARD_STYLE_PRESET_IDS)[number]

export const CARD_FONT_IDS = ['default', 'serif', 'rounded', 'mono'] as const
export type CardFontId = (typeof CARD_FONT_IDS)[number]

export const CARD_ALIGNMENT_IDS = ['left', 'center', 'right'] as const
export type CardAlignmentId = (typeof CARD_ALIGNMENT_IDS)[number]

export interface CardStyleInput {
  preset: CardStylePresetId
  font: CardFontId
  textSize: number
  alignment: CardAlignmentId
}

export interface CardStyleVars extends Record<string, string> {
  '--card-style-bg': string
  '--card-style-ink': string
  '--card-style-border': string
  '--card-style-font': string
  '--card-style-size': string
  '--card-style-align': string
}

export const MIN_CARD_TEXT_SIZE = 14
export const MAX_CARD_TEXT_SIZE = 40

export function clampCardTextSize(value: number): number {
  if (Number.isNaN(value)) return MIN_CARD_TEXT_SIZE
  return Math.min(MAX_CARD_TEXT_SIZE, Math.max(MIN_CARD_TEXT_SIZE, Math.round(value)))
}

const FONTS: Record<CardFontId, string> = {
  default: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
  rounded: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, monospace',
}

/** Grain drawn by the browser rather than shipped — an inline SVG costs nothing to download. */
function grain(opacity: number, frequency: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="3"/></filter><rect width="120" height="120" filter="url(#n)" opacity="${opacity}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

interface PresetSkin {
  bg: string
  ink: string
  border: string
}

/**
 * `chalk`, `notebook` and `paper` are printed surfaces, not app chrome: their colours are intrinsic
 * to the material and stay fixed in both themes. `plain` and `outlined` follow the theme's tokens.
 */
const PRESETS: Record<CardStylePresetId, PresetSkin> = {
  plain: {
    bg: 'var(--card)',
    ink: 'var(--heading)',
    border: '1px solid var(--border)',
  },
  outlined: {
    bg: 'var(--card)',
    ink: 'var(--heading)',
    border: '2.5px solid var(--heading)',
  },
  chalk: {
    bg: `${grain(0.28, '0.85')}, linear-gradient(160deg, #3b4450, #232a33)`,
    ink: '#f2f5f7',
    border: '1px solid rgba(255,255,255,0.14)',
  },
  notebook: {
    bg: 'repeating-linear-gradient(180deg, transparent 0 27px, rgba(80,120,200,0.22) 27px 28px), linear-gradient(180deg, #fffdf8, #fdf7ef)',
    ink: '#28303a',
    border: '1px solid rgba(80,120,200,0.25)',
  },
  paper: {
    bg: `${grain(0.16, '0.65')}, radial-gradient(120% 100% at 30% 0%, #f7ecd8, #e6d2b3)`,
    ink: '#4a3620',
    border: '1px solid rgba(120,90,50,0.25)',
  },
}

/**
 * The classes that consume the variables above. `CardFace`, the settings preview and the preset
 * thumbnails all wear these, so the three cannot drift — the spec's "one implementation" is these
 * two strings plus `resolveCardStyle`, not a shared component (the study card carries chrome a
 * thumbnail must not).
 */
export const CARD_STYLE_SURFACE =
  '[background:var(--card-style-bg)] [border:var(--card-style-border)]'

export const CARD_STYLE_TEXT =
  '[color:var(--card-style-ink)] [font-family:var(--card-style-font)] ' +
  '[font-size:var(--card-style-size)] [text-align:var(--card-style-align)]'

export function resolveCardStyle(style: CardStyleInput): CardStyleVars {
  const skin = PRESETS[style.preset]
  return {
    '--card-style-bg': skin.bg,
    '--card-style-ink': skin.ink,
    '--card-style-border': skin.border,
    '--card-style-font': FONTS[style.font],
    '--card-style-size': `${clampCardTextSize(style.textSize)}px`,
    '--card-style-align': style.alignment,
  }
}
