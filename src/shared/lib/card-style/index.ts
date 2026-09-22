export * from './ids'
export { clampCardTextSize, coerceCardStyle, sameCardStyle } from './coerce'
export { CHROME_TOKENS, type SceneChrome } from './presets'

import type { ColorScheme } from '../color-scheme'
import type { CardSceneVars, CardStyleInput, CardStyleVars } from './ids'
import { coerceCardStyle } from './coerce'
import { FONTS } from './materials'
import { PRESETS, type PresetSkin, type SceneChrome } from './presets'

/**
 * The material as it is printed in the scheme the app is painted in. A preset with no night
 * rendition is made of tokens, which the theme remaps on its own.
 */
function skinFor(input: CardStyleInput, scheme: ColorScheme): Omit<PresetSkin, 'dark'> {
  const skin = PRESETS[coerceCardStyle(input).preset]
  return scheme === 'dark' ? (skin.dark ?? skin) : skin
}

export const CARD_STYLE_SURFACE =
  '[background:var(--card-style-bg)] [border:var(--card-style-border)]'

export const CARD_STYLE_TEXT =
  '[color:var(--card-style-ink)] [font-family:var(--card-style-font)] ' +
  '[font-size:var(--card-style-size)] [text-align:var(--card-style-align)]'

export const CARD_SCENE_SURFACE = '[background:var(--scene-bg)]'

export function resolveCardStyle(input: CardStyleInput, scheme: ColorScheme): CardStyleVars {
  const style = coerceCardStyle(input)
  const skin = skinFor(input, scheme)
  return {
    '--card-style-bg': skin.bg,
    '--card-style-ink': skin.ink,
    '--card-style-border': skin.border,
    '--card-style-font': FONTS[style.font],
    '--card-style-size': `${style.textSize}px`,
    '--card-style-align': style.alignment,
  }
}

export function resolveCardScene(input: CardStyleInput, scheme: ColorScheme): CardSceneVars {
  return { '--scene-bg': skinFor(input, scheme).scene }
}

export function cardSceneChrome(
  input: CardStyleInput,
  scheme: ColorScheme,
): SceneChrome | undefined {
  return skinFor(input, scheme).chrome
}

/**
 * Whether the scene is a light surface or a dark one — what the status bar's white clock sits on
 * when a screen runs its scene under it. A preset made of tokens follows the scheme.
 */
export function sceneTone(input: CardStyleInput, scheme: ColorScheme): ColorScheme {
  return skinFor(input, scheme).chrome ?? scheme
}
