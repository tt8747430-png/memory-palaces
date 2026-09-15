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
  'bold',
  'frost',
  'sky',
  'meadow',
  'marble',
  'notebook',
  'paper',
  'parchment',
  'chalk',
  'night',
] as const
export type CardStylePresetId = (typeof CARD_STYLE_PRESET_IDS)[number]

export const CARD_FONT_IDS = ['default', 'serif', 'rounded', 'hand', 'mono'] as const
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

/**
 * Where a style that names something the app no longer has comes to rest. Not `DEFAULT_CARD_STYLE`
 * — that lives in `entities/deck`, a layer this one may not import — so `deck/model/types.test.ts`
 * holds the two to each other instead.
 */
const FALLBACK: CardStyleInput = {
  preset: 'plain',
  font: 'default',
  textSize: 30,
  alignment: 'center',
}

const known = <T extends string>(ids: readonly T[], value: string): value is T =>
  (ids as readonly string[]).includes(value)

/**
 * A stored style snapped back onto what the app still has — the generalisation of
 * `clampCardTextSize` to the other three fields, and the reason retiring a preset is safe.
 *
 * The types say a `CardStyleInput` can only name a live id. Storage disagrees: a deck row is JSON
 * that arrives from two directions, and only one of them is migrated. `deckMigrations[3]` rewrites
 * the documents already on this device, but replication pulls rows straight into the collection
 * (`shared/api/supabase/replication.ts`) — RxDB runs no migration strategy on a replicated write and
 * no validator plugin is registered — so a second, un-upgraded device can hand this one a deck that
 * still says `outlined` long after the migration ran. Unhandled, that was `PRESETS[preset]`
 * undefined and a TypeError on the study screen.
 *
 * So the coercion sits at both seams a foreign style can enter by: the resolvers below, which makes
 * painting total, and `resolveDeckSettings`, which is what keeps `validateDeckSettings` free to go
 * on throwing — reads degrade, writes stay strict.
 */
export function coerceCardStyle(style: CardStyleInput): CardStyleInput {
  return {
    preset: known(CARD_STYLE_PRESET_IDS, style.preset) ? style.preset : FALLBACK.preset,
    font: known(CARD_FONT_IDS, style.font) ? style.font : FALLBACK.font,
    alignment: known(CARD_ALIGNMENT_IDS, style.alignment) ? style.alignment : FALLBACK.alignment,
    textSize: clampCardTextSize(style.textSize),
  }
}

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
const FONTS: Record<CardFontId, string> = {
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
    '<feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="4" seed="7" stitchTiles="stitch"/>' +
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
 * Soft white masses: low-frequency noise, wider than it is tall, pushed through an inverted alpha
 * ramp so the smooth middle of the field drops out and only the crests stay opaque.
 */
function clouds(opacity: number): string {
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
function blades(opacity: number): string {
  return texture(
    200,
    '<feTurbulence type="fractalNoise" baseFrequency="0.62 0.014" numOctaves="3" seed="5" stitchTiles="stitch"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0.16 0 0 0 0 0.3 0 0 0 0 0.1 1.15 0 0 0 -0.34"/>',
    opacity,
  )
}

/** Marble veining: wide noise blurred back down, so the bright ridges read as wisps and not grit. */
function veins(opacity: number): string {
  return texture(
    360,
    '<feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="5" seed="13" stitchTiles="stitch"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 -0.56"/>' +
      '<feGaussianBlur stdDeviation="0.7"/>',
    opacity,
  )
}

/** Cork: mid-frequency noise kept coarse, so the flecks stay the size of pressed granules. */
function granules(opacity: number): string {
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
const RULE_SPACING = '28px'

/**
 * The semantic tokens the study session's chrome paints from. A printed scene remaps them for its
 * own subtree, so `StudySessionHeader`, the flag and speaker buttons, the mode and gear controls — every
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
 * Every preset but `plain` is a printed surface, not app chrome: its colours are intrinsic to the
 * material and stay fixed in both themes — the exception CODE_STYLE §5 grants this file. `plain` is
 * the one that follows the theme's tokens, and its scene is the app's own backdrop.
 *
 * The order is the order of the strip, and it walks from the app's own paper out through daylight
 * to the printed stock and into the dark. `outlined` used to sit second: the theme's ink stroked
 * around the theme's paper, which in dark mode was a white rectangle drawn around a dark card and
 * read as a rendering fault. `bold` is that idea done as a material — a real poster stock with a
 * black keyline on orange — and it replaced it rather than reskinning it, so a deck that stored
 * `outlined` is migrated to `plain` (`deckMigrations[3]`).
 */
const PRESETS: Record<CardStylePresetId, PresetSkin> = {
  plain: {
    // The card is the theme's own paper, opaque and nothing else — a white wash over it read as a
    // 60% highlight on a dark `--surface` in dark mode, which is the exception this preset is
    // explicitly outside. What separates it from the scene is its border and the card's shadow.
    bg: 'var(--surface)',
    ink: 'var(--text-heading)',
    border: '1px solid var(--border)',
    // The app's own backdrop, untouched. A vignette was drawn over it here for a while, which meant
    // a literal `rgba()` on the one preset whose whole job is to follow the tokens — and the panel
    // test had to be loosened off `toBe` to let it through. The scene is the token.
    scene: 'var(--bg-daylight)',
  },
  bold: {
    bg: '#fffdf6',
    ink: '#141416',
    border: '3px solid #141416',
    scene: `${grain(0.09, '0.6')}, radial-gradient(125% 95% at 50% 0%, #ffb84d, #f2951f 52%, #d87208)`,
    chrome: 'light',
  },
  frost: {
    // Translucent on purpose: the scene under it is one smooth gradient, so letting it through is
    // the frosted panel — no `backdrop-filter`, which would build a containing block inside the
    // study card's flip and is a blur of nothing here anyway.
    bg: 'linear-gradient(155deg, rgba(255,255,255,0.74), rgba(255,255,255,0.44) 55%, rgba(255,255,255,0.6))',
    ink: '#23252a',
    border: '1px solid rgba(255,255,255,0.62)',
    scene: `${grain(0.07, '0.75')}, linear-gradient(200deg, #f7ece0 0%, #d9cfc5 34%, #a7a29c 64%, #6c6b6a 100%)`,
    chrome: 'light',
  },
  sky: {
    bg: '#ffffff',
    ink: '#1c2430',
    border: '1px solid rgba(255,255,255,0.9)',
    scene: `${clouds(0.9)}, linear-gradient(180deg, #5fb0ea 0%, #8dc8f0 54%, #d2e7f8 100%)`,
    chrome: 'light',
  },
  meadow: {
    bg: `${grain(0.07, '0.7')}, linear-gradient(180deg, #fdfbf1, #f6f1e2)`,
    ink: '#2b3526',
    border: '1px solid rgba(255,255,255,0.74)',
    scene: `${blades(0.6)}, linear-gradient(180deg, #6a9744 0%, #467230 58%, #2b4c1f 100%)`,
    chrome: 'light',
  },
  marble: {
    bg: '#ffffff',
    ink: '#1b2a2e',
    border: '1px solid rgba(255,255,255,0.86)',
    scene: `${veins(0.52)}, ${grain(0.08, '0.8')}, linear-gradient(160deg, #82ccbf 0%, #4ea79b 46%, #2d7d74 100%)`,
    chrome: 'light',
  },
  notebook: {
    // The red margin rule a ruled pad actually has, drawn once at 2.25rem in, over blue rules at
    // the pad's own spacing.
    bg:
      'linear-gradient(90deg, transparent 2.25rem, rgba(214,90,90,0.38) 2.25rem calc(2.25rem + 1px), transparent calc(2.25rem + 1px)), ' +
      `repeating-linear-gradient(180deg, transparent 0 calc(${RULE_SPACING} - 1px), rgba(80,120,200,0.24) calc(${RULE_SPACING} - 1px) ${RULE_SPACING}), ` +
      `${grain(0.06, '0.72')}, linear-gradient(180deg, #fffdf8, #fdf6ec)`,
    ink: '#28303a',
    border: '1px solid rgba(80,120,200,0.28)',
    scene: `${grain(0.12, '0.62')}, linear-gradient(165deg, #eae3d5, #cec3af)`,
    chrome: 'light',
  },
  paper: {
    // A kraft index card pinned to a cork board, and the granules behind it are the pressed board
    // it hangs on.
    bg: `${grain(0.15, '0.62')}, linear-gradient(170deg, #f7e9cf, #e7d3ae)`,
    ink: '#4a3620',
    border: '1px solid rgba(120,90,50,0.3)',
    scene: `${granules(0.55)}, ${grain(0.16, '0.5')}, linear-gradient(165deg, #ca9c65, #a4753e)`,
    chrome: 'light',
  },
  parchment: {
    bg: `${grain(0.11, '0.68')}, radial-gradient(118% 96% at 50% 42%, transparent 54%, rgba(120,90,50,0.2)), radial-gradient(130% 110% at 40% 0%, #fbf3e2, #ecdcbe)`,
    ink: '#5a4021',
    border: '2px solid rgba(255,252,242,0.75)',
    scene: `${contour(0.5)}, ${grain(0.13, '0.55')}, radial-gradient(130% 110% at 50% 10%, #ddc79c, #b99a68)`,
    chrome: 'light',
  },
  chalk: {
    // The dust a board keeps in its corners, over a finer tooth than the slate behind it.
    bg: `${grain(0.22, '0.95')}, radial-gradient(120% 100% at 50% 50%, transparent 50%, rgba(255,255,255,0.06)), radial-gradient(125% 95% at 50% 0%, rgba(255,255,255,0.09), transparent 58%), linear-gradient(160deg, #3b4450, #212832)`,
    ink: '#f4f7f9',
    border: '1px solid rgba(255,255,255,0.16)',
    scene: `${grain(0.18, '0.86')}, linear-gradient(165deg, #2a313b, #13181d)`,
    chrome: 'dark',
  },
  night: {
    bg: `${grain(0.08, '0.95')}, radial-gradient(125% 95% at 50% 0%, rgba(146,160,255,0.13), transparent 58%), linear-gradient(165deg, #212739, #12151d)`,
    ink: '#e9edf6',
    border: '1px solid rgba(255,255,255,0.13)',
    // Two nebulae under the starfield, off-centre so the sky has a direction to it.
    scene: `${stars(0.9)}, radial-gradient(70% 55% at 22% 18%, rgba(122,88,220,0.4), transparent 70%), radial-gradient(80% 60% at 82% 74%, rgba(34,118,190,0.38), transparent 72%), radial-gradient(125% 95% at 50% 0%, #222a40, #090b12)`,
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

export function resolveCardStyle(input: CardStyleInput): CardStyleVars {
  const style = coerceCardStyle(input)
  const skin = PRESETS[style.preset]
  return {
    '--card-style-bg': skin.bg,
    '--card-style-ink': skin.ink,
    '--card-style-border': skin.border,
    '--card-style-font': FONTS[style.font],
    '--card-style-size': `${style.textSize}px`,
    '--card-style-align': style.alignment,
  }
}

/** The room the card is studied in: the backdrop behind it. */
export function resolveCardScene(input: CardStyleInput): CardSceneVars {
  return { '--scene-bg': PRESETS[coerceCardStyle(input).preset].scene }
}

/**
 * Which printed chrome the room is lit by, or `undefined` where the preset follows the app's own
 * theme. `CardScene` puts it on the element as `data-scene`; `tokens.css` does the repainting.
 */
export function cardSceneChrome(input: CardStyleInput): SceneChrome | undefined {
  return PRESETS[coerceCardStyle(input).preset].chrome
}
