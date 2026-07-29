import { useMemo } from 'react'
import { findEntity, resolveDeckSettings, selectIsReady } from '@/shared/lib'
import { useDeckStore } from './context'
import { selectDecks } from './selectors'
import { type Deck, type DeckSettings, DEFAULT_DECK_SETTINGS } from './types'

export interface DeckLookup {
  /** Every deck, for callers that also walk the tree. */
  decks: Deck[]
  /** The deck itself — `undefined` once `ready` and the id is stale. */
  deck: Deck | undefined
  /** The deck's settings with its ancestors' choices already folded in. */
  settings: DeckSettings
  ready: boolean
}

/**
 * One deck as a screen needs it. Reading a deck always means the same three
 * steps — wait for the store, find it by id, inherit settings down its
 * ancestry — so they live here rather than being spelled out on every screen
 * that opens a deck.
 */
export function useDeck(deckId: string): DeckLookup {
  const decks = useDeckStore(selectDecks)
  const ready = useDeckStore(selectIsReady)

  const deck = useMemo(() => findEntity(decks, deckId), [decks, deckId])
  const settings = useMemo(
    () => resolveDeckSettings(decks, deckId, DEFAULT_DECK_SETTINGS),
    [decks, deckId],
  )

  return { decks, deck, settings, ready }
}
