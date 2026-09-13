import {
  type Deck,
  type DeckSettings,
  type DeckStore,
  isSubdeck,
  MAIN_DECK_SETTINGS,
} from '@/entities/deck'
import { editDeck, requireDeck } from './deck-commands'

/**
 * Patch a deck's settings without disturbing the rest of them. Every settings surface writes
 * through here, so none of them has to remember that `settings` is a partial override merged over
 * the inherited defaults — spreading the wrong base is how a deck loses a setting it never touched.
 *
 * A subdeck follows its main deck for `MAIN_DECK_SETTINGS`. The screens never offer the change, so
 * a patch carrying one is a bug upstream and is refused rather than silently dropped.
 */
export async function updateDeckSettings(
  store: DeckStore,
  deckId: string,
  patch: Partial<DeckSettings>,
): Promise<Deck> {
  const current = requireDeck(store, deckId)
  if (isSubdeck(current)) {
    const owned = MAIN_DECK_SETTINGS.filter((key) => patch[key] !== undefined)
    if (owned.length > 0) {
      throw new Error(`A subdeck follows its main deck for ${owned.join(', ')}`)
    }
  }
  return editDeck(store, deckId, { settings: { ...current.settings, ...patch } })
}
