import {
  CARD_ALIGNMENT_IDS,
  CARD_FONT_IDS,
  CARD_STYLE_PRESET_IDS,
  type CardStyleInput,
  MAX_CARD_TEXT_SIZE,
  MIN_CARD_TEXT_SIZE,
} from './ids'

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

const FALLBACK: CardStyleInput = {
  preset: 'plain',
  font: 'default',
  textSize: 30,
  alignment: 'center',
}

const known = <T extends string>(ids: readonly T[], value: string): value is T =>
  (ids as readonly string[]).includes(value)

export function coerceCardStyle(style: CardStyleInput): CardStyleInput {
  return {
    preset: known(CARD_STYLE_PRESET_IDS, style.preset) ? style.preset : FALLBACK.preset,
    font: known(CARD_FONT_IDS, style.font) ? style.font : FALLBACK.font,
    alignment: known(CARD_ALIGNMENT_IDS, style.alignment) ? style.alignment : FALLBACK.alignment,
    textSize: clampCardTextSize(style.textSize),
  }
}
