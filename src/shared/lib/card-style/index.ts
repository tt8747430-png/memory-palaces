export * from './ids'
export { clampCardTextSize, coerceCardStyle, sameCardStyle } from './coerce'
export { CHROME_TOKENS, type SceneChrome } from './presets'

import type { CardSceneVars, CardStyleInput, CardStyleVars } from './ids'
import { coerceCardStyle } from './coerce'
import { FONTS } from './materials'
import { PRESETS, type SceneChrome } from './presets'

export const CARD_STYLE_SURFACE =
  '[background:var(--card-style-bg)] [border:var(--card-style-border)]'

export const CARD_STYLE_TEXT =
  '[color:var(--card-style-ink)] [font-family:var(--card-style-font)] ' +
  '[font-size:var(--card-style-size)] [text-align:var(--card-style-align)]'

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

export function resolveCardScene(input: CardStyleInput): CardSceneVars {
  return { '--scene-bg': PRESETS[coerceCardStyle(input).preset].scene }
}

export function cardSceneChrome(input: CardStyleInput): SceneChrome | undefined {
  return PRESETS[coerceCardStyle(input).preset].chrome
}
