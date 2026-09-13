import { useMemo } from 'react'
import { findEntity, selectIsReady } from '@/shared/lib'
import { useDeckStore } from './context'
import { selectDecks } from './selectors'
import { mainDeckOf, resolveDeckSettings } from './settings'
import type { Deck, DeckSettings } from './types'

export interface DeckLookup {
  /** Every deck, for callers that also walk the tree. */
  decks: Deck[]
  /** The deck itself — `undefined` once `ready` and the id is stale. */
  deck: Deck | undefined
  /**
   * The top of the deck's tree — the deck itself when it is not a subdeck. What owns the main deck's
   * settings (`MAIN_DECK_SETTINGS`) for everything under it.
   */
  mainDeck: Deck | undefined
  /** The deck's settings with its ancestors' choices already folded in. */
  settings: DeckSettings
  ready: boolean
}

/**
 * One deck as a screen needs it. Reading a deck always means the same three steps — wait for the
 * store, find it by id, inherit settings down its ancestry — so they live here rather than being
 * respelled on every screen that opens a deck.
 */
export function useDeck(deckId: string): DeckLookup {
  const decks = useDeckStore(selectDecks)
  const ready = useDeckStore(selectIsReady)

  const deck = useMemo(() => findEntity(decks, deckId), [decks, deckId])
  const mainDeck = useMemo(() => mainDeckOf(decks, deckId), [decks, deckId])
  const settings = useMemo(() => resolveDeckSettings(decks, deckId), [decks, deckId])

  return { decks, deck, mainDeck, settings, ready }
}
