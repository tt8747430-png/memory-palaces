import {
  type Deck,
  type DeckSettings,
  type DeckStore,
  isSubdeck,
  MAIN_DECK_SETTINGS,
} from '@/entities/deck'
import { editDeck, requireDeck } from './deck-commands'

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
