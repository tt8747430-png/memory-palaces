import { deckPath, inheritSettings } from '@/shared/lib'
import { type Deck, type DeckSettings, DEFAULT_DECK_SETTINGS, MAIN_DECK_SETTINGS } from './types'

/**
 * A deck's settings as it is studied by them: its own and its ancestors' overrides folded over the
 * defaults, nearest winning — except `MAIN_DECK_SETTINGS`, which come from its main deck alone.
 */
export function resolveDeckSettings(decks: readonly Deck[], deckId: string): DeckSettings {
  return inheritSettings(decks, deckId, DEFAULT_DECK_SETTINGS, MAIN_DECK_SETTINGS)
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
