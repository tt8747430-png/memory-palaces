import {
  CARD_ALIGNMENT_IDS,
  CARD_FONT_IDS,
  CARD_STYLE_PRESET_IDS,
  type CardStyleInput,
  MAX_CARD_TEXT_SIZE,
  MIN_CARD_TEXT_SIZE,
} from './ids'

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
