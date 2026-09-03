/**
 * A card's look, resolved once into custom properties. Preview thumbnails, the style page's live
 * card and the study card all read the same variables, so none of them can drift from the others.
 *
 * A preset is a *scene*, not just a card: it owns the surface the card is printed on and the screen
 * it is studied against. `resolveCardStyle` answers the first, `resolveCardScene` the second, both
 * off the one `PRESETS` table — a preset cannot gain a card face without gaining the room it sits
 * in.
 */
export const CARD_STYLE_PRESET_IDS = [
  'plain',
  'outlined',
  'chalk',
  'notebook',
  'paper',
  'parchment',
  'night',
] as const
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

export interface CardSceneVars extends Record<string, string> {
  '--scene-bg': string
}

export const MIN_CARD_TEXT_SIZE = 14
export const MAX_CARD_TEXT_SIZE = 40

/**
 * Whether two styles would paint the same card. The style page edits a draft and only writes it on
 * Apply, so "has anything changed?" is a question about the whole style, not any one control.
 */
export function sameCardStyle(a: CardStyleInput, b: CardStyleInput): boolean {
  return (
    a.preset === b.preset &&
    a.font === b.font &&
    a.alignment === b.alignment &&
    clampCardTextSize(a.textSize) === clampCardTextSize(b.textSize)
  )
}

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

/**
 * A texture drawn by the browser rather than shipped — an inline SVG costs nothing to download.
 * All three below are one filtered rect; they differ only in size and in what the filter does.
 */
function texture(size: number, filter: string, opacity: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><filter id="f">${filter}</filter><rect width="${size}" height="${size}" filter="url(#f)" opacity="${opacity}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/** Fibrous noise, for the tooth of a printed surface. */
function grain(opacity: number, frequency: string): string {
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
function contour(opacity: number): string {
  return texture(
    320,
    '<feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="4" seed="7"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0.42 0 0 0 0 0.28 0 0 0 0 0.11 1 0 0 0 0"/>' +
      '<feComponentTransfer><feFuncA type="discrete" tableValues="0 0 0 1 0 0 0 1 0 0 0 1"/></feComponentTransfer>',
    opacity,
  )
}

/** High-frequency noise clipped hard, so only the brightest specks survive as stars. */
function stars(opacity: number): string {
  return texture(
    240,
    '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 -0.74"/>',
    opacity,
  )
}

/**
 * The semantic tokens the session chrome paints from. A printed scene remaps them for its own
 * subtree, so `SessionHeader`, the flag and speaker buttons, the mode and gear controls — every one
 * of which already reads these — stay legible on slate or on parchment without knowing a scene
 * exists.
 *
 * `--surface` is in the list because `bg-card` resolves to it: the type-answer field and the
 * direction chip sit inside the scene wearing `bg-card` with `text-foreground`, and remapping the
 * ink without the paper under it is how you get white text typed onto white. The tinted pairs are
 * there for the same reason one step out — the session footer's grade buttons and the remaining
 * tallies are painted from them.
 *
 * `CHROME_TOKENS` is the whole set, and every printed scene must answer for all of it:
 * `card-style.test.ts` checks the tables against this list, so a token added here without a value
 * fails rather than silently keeping the app's own.
 */
export const CHROME_TOKENS = [
  '--surface',
  '--text-heading',
  '--text-primary',
  '--text-muted',
  '--surface-glass',
  '--info-surface',
  '--info-foreground',
  '--border',
  '--secondary',
  '--secondary-foreground',
  '--success-surface',
  '--success-on-surface',
  '--warning-surface',
  '--warning-foreground',
  '--danger-surface',
  '--danger-on-surface',
] as const

type ChromeTokens = Record<(typeof CHROME_TOKENS)[number], string>

/** Mirrors the app's own dark theme, so a dark scene's controls read the way dark mode does. */
const DARK_CHROME: ChromeTokens = {
  '--surface': '#222836',
  '--text-heading': '#f3f6fa',
  '--text-primary': '#e4eaf1',
  '--text-muted': 'rgba(228,234,241,0.66)',
  '--surface-glass': 'rgba(255,255,255,0.13)',
  '--info-surface': 'rgba(255,255,255,0.15)',
  '--info-foreground': '#f3f6fa',
  '--border': 'rgba(255,255,255,0.17)',
  '--secondary': 'oklch(var(--p-tint-sky) / 0.16)',
  '--secondary-foreground': 'oklch(97.9% 0.01 267.4)',
  '--success-surface': 'oklch(69.6% 0.149 162.5 / 0.16)',
  '--success-on-surface': 'oklch(86% 0.11 165)',
  '--warning-surface': 'oklch(76.9% 0.165 70.1 / 0.16)',
  '--warning-foreground': 'oklch(86% 0.13 80)',
  '--danger-surface': 'oklch(63.7% 0.208 25.3 / 0.18)',
  '--danger-on-surface': 'oklch(82% 0.12 22)',
}

/** And the light one, so a paper scene stays paper even while the app is in dark mode. */
const LIGHT_CHROME: ChromeTokens = {
  '--surface': '#fffdf7',
  '--text-heading': '#2f2a22',
  '--text-primary': '#3d3428',
  '--text-muted': 'rgba(61,52,40,0.64)',
  '--surface-glass': 'rgba(255,253,247,0.8)',
  '--info-surface': 'rgba(255,253,247,0.74)',
  '--info-foreground': '#2f2a22',
  '--border': 'rgba(72,57,36,0.2)',
  '--secondary': 'var(--p-blue-300)',
  '--secondary-foreground': 'var(--p-navy-900)',
  '--success-surface': 'var(--p-green-50)',
  '--success-on-surface': 'var(--p-green-800)',
  '--warning-surface': 'var(--p-amber-50)',
  '--warning-foreground': 'var(--p-amber-700)',
  '--danger-surface': 'var(--p-red-50)',
  '--danger-on-surface': 'var(--p-red-700)',
}

interface PresetSkin {
  bg: string
  ink: string
  border: string
  /** The screen the card is studied against. */
  scene: string
  /** Absent for the token-following presets — they inherit the app's own chrome unchanged. */
  chrome?: ChromeTokens
}

/**
 * `chalk`, `notebook`, `paper`, `parchment` and `night` are printed surfaces, not app chrome: their
 * colours are intrinsic to the material and stay fixed in both themes — the exception CODE_STYLE §5
 * grants this file. `plain` and `outlined` follow the theme's tokens, and their scene is the app's
 * own backdrop.
 */
const PRESETS: Record<CardStylePresetId, PresetSkin> = {
  plain: {
    bg: 'linear-gradient(180deg, rgba(255,255,255,0.6), transparent 42%), var(--surface)',
    ink: 'var(--text-heading)',
    border: '1px solid var(--border)',
    scene: 'var(--bg-daylight)',
  },
  outlined: {
    bg: 'var(--surface)',
    ink: 'var(--text-heading)',
    border: '2.5px solid var(--text-heading)',
    scene: 'var(--bg-daylight)',
  },
  chalk: {
    bg: `${grain(0.28, '0.85')}, radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.07), transparent 60%), linear-gradient(160deg, #3b4450, #232a33)`,
    ink: '#f2f5f7',
    border: '1px solid rgba(255,255,255,0.14)',
    scene: `${grain(0.2, '0.8')}, linear-gradient(165deg, #2b323c, #161b21)`,
    chrome: DARK_CHROME,
  },
  notebook: {
    // The red margin rule a ruled pad actually has, drawn once at 2.25rem in.
    bg: 'linear-gradient(90deg, transparent 2.25rem, rgba(214,90,90,0.35) 2.25rem calc(2.25rem + 1px), transparent calc(2.25rem + 1px)), repeating-linear-gradient(180deg, transparent 0 27px, rgba(80,120,200,0.22) 27px 28px), linear-gradient(180deg, #fffdf8, #fdf7ef)',
    ink: '#28303a',
    border: '1px solid rgba(80,120,200,0.25)',
    scene: `${grain(0.1, '0.7')}, linear-gradient(180deg, #e8e2d6, #d6cdbd)`,
    chrome: LIGHT_CHROME,
  },
  paper: {
    bg: `${grain(0.16, '0.65')}, radial-gradient(115% 95% at 50% 45%, transparent 55%, rgba(120,90,50,0.16)), radial-gradient(120% 100% at 30% 0%, #f7ecd8, #e6d2b3)`,
    ink: '#4a3620',
    border: '1px solid rgba(120,90,50,0.25)',
    scene: `${grain(0.14, '0.6')}, radial-gradient(120% 100% at 50% 0%, #e7d5b4, #c8ac81)`,
    chrome: LIGHT_CHROME,
  },
  parchment: {
    bg: `${grain(0.12, '0.7')}, radial-gradient(115% 95% at 50% 45%, transparent 58%, rgba(120,90,50,0.14)), radial-gradient(130% 110% at 40% 0%, #fbf3e2, #ecdcbe)`,
    ink: '#5a4021',
    border: '2px solid rgba(255,252,242,0.72)',
    scene: `${contour(0.5)}, ${grain(0.13, '0.55')}, radial-gradient(130% 110% at 50% 10%, #ddc79c, #b99a68)`,
    chrome: LIGHT_CHROME,
  },
  night: {
    bg: `${grain(0.1, '0.9')}, radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.06), transparent 55%), linear-gradient(165deg, #232836, #14171f)`,
    ink: '#e9edf6',
    border: '1px solid rgba(255,255,255,0.12)',
    scene: `${stars(0.85)}, radial-gradient(120% 90% at 50% 0%, #232a3d, #0c0e15)`,
    chrome: DARK_CHROME,
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

/**
 * The backdrop layer. Nothing but the shorthand: a `bg-cover` beside it would be reset by
 * `background` anyway, and where it won it would stretch the grain and star tiles instead of
 * letting them repeat at their own size. The gradients are all percentage-sized already.
 */
export const CARD_SCENE_SURFACE = '[background:var(--scene-bg)]'

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

/**
 * The room the card is studied in: the backdrop, plus the chrome tokens a printed scene has to
 * repaint so the controls over it stay readable.
 */
export function resolveCardScene(style: CardStyleInput): CardSceneVars {
  const skin = PRESETS[style.preset]
  return { '--scene-bg': skin.scene, ...skin.chrome }
}
