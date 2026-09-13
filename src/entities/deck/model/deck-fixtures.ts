import { type Deck, makeDeck } from './types'

/**
 * A deck for the slice's tests, built past `makeDeck` so it can carry what one stored before the
 * current rules did — an archived deck still in its folder, a subdeck holding main deck settings.
 */
export function storedDeck(id: string, over: Partial<Deck> = {}): Deck {
  return { ...makeDeck({ id, createdAt: new Date(0).toISOString(), name: id }), ...over }
}
