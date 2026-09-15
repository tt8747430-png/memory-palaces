import { useMemo } from 'react'
import { findEntity, selectIsReady } from '@/shared/lib'
import { useDeckStore } from './context'
import { selectDecks } from './selectors'
import { mainDeckOf, resolveDeckSettings } from './settings'
import type { Deck, DeckSettings } from './types'

export interface DeckLookup {
  decks: Deck[]
  deck: Deck | undefined
  mainDeck: Deck | undefined
  settings: DeckSettings
  ready: boolean
}

export function useDeck(deckId: string): DeckLookup {
  const decks = useDeckStore(selectDecks)
  const ready = useDeckStore(selectIsReady)

  const deck = useMemo(() => findEntity(decks, deckId), [decks, deckId])
  const mainDeck = useMemo(() => mainDeckOf(decks, deckId), [decks, deckId])
  const settings = useMemo(() => resolveDeckSettings(decks, deckId), [decks, deckId])

  return { decks, deck, mainDeck, settings, ready }
}
