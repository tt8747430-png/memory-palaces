/**
 * The folder's public shape. `ids.ts` says what a style may be, `coerce.ts` narrows a stored one to
 * that, `materials.ts` draws the faces and textures, `presets.ts` maps each preset to a skin — and
 * the resolvers below read that table. Split from one 453-line file with no behaviour change.
 */
export * from './ids'
export { clampCardTextSize, coerceCardStyle, sameCardStyle } from './coerce'
export { CHROME_TOKENS, type SceneChrome } from './presets'

import type { CardSceneVars, CardStyleInput, CardStyleVars } from './ids'
import { coerceCardStyle } from './coerce'
import { FONTS } from './materials'
import { PRESETS, type SceneChrome } from './presets'

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
