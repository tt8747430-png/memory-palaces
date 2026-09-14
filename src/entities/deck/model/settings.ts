import { coerceCardStyle, deckPath, inheritSettings } from '@/shared/lib'
import { type Deck, type DeckSettings, DEFAULT_DECK_SETTINGS, MAIN_DECK_SETTINGS } from './types'

/**
 * A deck's settings as it is studied by them: its own and its ancestors' overrides folded over the
 * defaults, nearest winning — except `MAIN_DECK_SETTINGS`, which come from its main deck alone.
 *
 * The card style is coerced on the way out, which extends this seam's existing promise — a missing
 * key resolves to the default at read time — from absent keys to *unknown values*. A retired preset
 * can reach a deck without passing the migration (see `coerceCardStyle`), and every consumer reads
 * through here: the style page's draft, `studyPrefsFromSettings`, the preset thumbnails. Coercing
 * once here is what lets `validateDeckSettings` go on throwing for writes — otherwise a learner
 * whose deck carried a retired id would crash the moment they nudged the text size and pressed
 * Apply, having changed nothing that was wrong.
 */
export function resolveDeckSettings(decks: readonly Deck[], deckId: string): DeckSettings {
  const settings = inheritSettings(decks, deckId, DEFAULT_DECK_SETTINGS, MAIN_DECK_SETTINGS)
  return { ...settings, cardStyle: coerceCardStyle(settings.cardStyle) }
}

/** The deck at the top of the tree `deckId` stands in — the deck itself when it is no subdeck. */
export function mainDeckOf(decks: readonly Deck[], deckId: string): Deck | undefined {
  return deckPath(decks, deckId)[0]
}

/**
 * The overrides of `MAIN_DECK_SETTINGS` that `deckId` is following — its main deck's. A subdeck that
 * becomes a main deck takes these as its own, so it goes on being studied the way it was.
 */
export function followedMainSettings(
  decks: readonly Deck[],
  deckId: string,
): Partial<DeckSettings> {
  const main = mainDeckOf(decks, deckId)
  if (!main) return {}
  return Object.fromEntries(
    MAIN_DECK_SETTINGS.filter((key) => main.settings[key] !== undefined).map((key) => [
      key,
      main.settings[key],
    ]),
  )
}
