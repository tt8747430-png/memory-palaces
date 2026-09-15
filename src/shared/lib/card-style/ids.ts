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
