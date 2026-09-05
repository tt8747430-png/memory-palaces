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
 * The semantic tokens the study session's chrome paints from. A printed scene remaps them for its
 * own subtree, so `SessionHeader`, the flag and speaker buttons, the mode and gear controls — every
 * one of which already reads these — stay legible on slate or on parchment without knowing a scene
 * exists. The values live in `tokens.css`, under `[data-scene='dark']` and `[data-scene='light']`,
 * beside the theme most of them mirror; this is the list they answer to.
 *
 * `--surface` is in the list because `bg-card` resolves to it: the type-answer field and the
 * direction chip sit inside the scene wearing `bg-card` with `text-foreground`, and remapping the
 * ink without the paper under it is how you get white text typed onto white. The tinted pairs are
 * there for the same reason one step out — the study session's grade buttons and the remaining
 * tallies are painted from them. So are the solid roles: the initials keypad is `bg-primary` with
 * `text-primary-foreground`, a wrong answer rings `ring-destructive`, and a starred card is
 * `fill-rating`. `--text-secondary` is in for a rule no utility names: base `p` is painted from it,
 * and the faces are full of paragraphs.
 *
 * `CHROME_TOKENS` is the whole set, and each scene block must answer for all of it —
 * `card-style.test.ts` holds the stylesheet to the list in both directions. The list itself is held
 * to the screen one layer up, by `widgets/study-session/ui/scene-chrome.test.ts`: it walks what
 * renders inside a `<CardScene>` and every semantic colour utility any of it wears has to resolve
 * to something in here, so a face that reaches for a new role fails rather than silently keeping
 * the app's own.
 */
export const CHROME_TOKENS = [
  '--surface',
  '--text-heading',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--surface-glass',
  '--info-surface',
  '--info-foreground',
  '--border',
  '--ring',
  '--primary',
  '--primary-foreground',
  '--accent',
  '--rating',
  '--secondary',
  '--secondary-foreground',
  '--success-surface',
  '--success-on-surface',
  '--warning-surface',
  '--warning-foreground',
  '--danger',
  '--danger-surface',
  '--danger-on-surface',
] as const

/**
 * Which of the two printed-chrome blocks in `tokens.css` a scene hands its subtree. One value, not
 * a table of colours: the colours belong in the stylesheet next to the theme they depart from.
 */
export type SceneChrome = 'dark' | 'light'

interface PresetSkin {
  bg: string
  ink: string
  border: string
  /** The screen the card is studied against. */
  scene: string
  /** Absent for the token-following presets — they inherit the app's own chrome unchanged. */
  chrome?: SceneChrome
}

/**
 * `chalk`, `notebook`, `paper`, `parchment` and `night` are printed surfaces, not app chrome: their
 * colours are intrinsic to the material and stay fixed in both themes — the exception CODE_STYLE §5
 * grants this file. `plain` and `outlined` follow the theme's tokens, and their scene is the app's
 * own backdrop.
 */
const PRESETS: Record<CardStylePresetId, PresetSkin> = {
  plain: {
    // The card is the theme's own paper, opaque and nothing else — a white wash over it read as a
    // 60% highlight on a dark `--surface` in dark mode, which is the exception this preset is
    // explicitly outside. What separates it from the scene is its border and the card's shadow.
    bg: 'var(--surface)',
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
    chrome: 'dark',
  },
  notebook: {
    // The red margin rule a ruled pad actually has, drawn once at 2.25rem in.
    bg: 'linear-gradient(90deg, transparent 2.25rem, rgba(214,90,90,0.35) 2.25rem calc(2.25rem + 1px), transparent calc(2.25rem + 1px)), repeating-linear-gradient(180deg, transparent 0 27px, rgba(80,120,200,0.22) 27px 28px), linear-gradient(180deg, #fffdf8, #fdf7ef)',
    ink: '#28303a',
    border: '1px solid rgba(80,120,200,0.25)',
    scene: `${grain(0.1, '0.7')}, linear-gradient(180deg, #e8e2d6, #d6cdbd)`,
    chrome: 'light',
  },
  paper: {
    bg: `${grain(0.16, '0.65')}, radial-gradient(115% 95% at 50% 45%, transparent 55%, rgba(120,90,50,0.16)), radial-gradient(120% 100% at 30% 0%, #f7ecd8, #e6d2b3)`,
    ink: '#4a3620',
    border: '1px solid rgba(120,90,50,0.25)',
    scene: `${grain(0.14, '0.6')}, radial-gradient(120% 100% at 50% 0%, #e7d5b4, #c8ac81)`,
    chrome: 'light',
  },
  parchment: {
    bg: `${grain(0.12, '0.7')}, radial-gradient(115% 95% at 50% 45%, transparent 58%, rgba(120,90,50,0.14)), radial-gradient(130% 110% at 40% 0%, #fbf3e2, #ecdcbe)`,
    ink: '#5a4021',
    border: '2px solid rgba(255,252,242,0.72)',
    scene: `${contour(0.5)}, ${grain(0.13, '0.55')}, radial-gradient(130% 110% at 50% 10%, #ddc79c, #b99a68)`,
    chrome: 'light',
  },
  night: {
    bg: `${grain(0.1, '0.9')}, radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.06), transparent 55%), linear-gradient(165deg, #232836, #14171f)`,
    ink: '#e9edf6',
    border: '1px solid rgba(255,255,255,0.12)',
    scene: `${stars(0.85)}, radial-gradient(120% 90% at 50% 0%, #232a3d, #0c0e15)`,
    chrome: 'dark',
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

/** The room the card is studied in: the backdrop behind it. */
export function resolveCardScene(style: CardStyleInput): CardSceneVars {
  return { '--scene-bg': PRESETS[style.preset].scene }
}

/**
 * Which printed chrome the room is lit by, or `undefined` where the preset follows the app's own
 * theme. `CardScene` puts it on the element as `data-scene`; `tokens.css` does the repainting.
 */
export function cardSceneChrome(style: CardStyleInput): SceneChrome | undefined {
  return PRESETS[style.preset].chrome
}
