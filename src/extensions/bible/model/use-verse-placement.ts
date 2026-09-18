import { useState } from 'react'
import type { Deck } from '@/entities/deck'
import type { VerseTarget } from './verse-target'

export type BibleImportSheet = 'deck' | 'name'

export interface VersePlacement {
  target: VerseTarget
  /** The deck name to show while the learner is placing the cards; null while the app places them. */
  destination: string | null
  pickDeck: (deckId: string) => void
  nameDeck: (name: string) => void
  sheet: BibleImportSheet | null
  showSheet: (sheet: BibleImportSheet | null) => void
}

/**
 * Where the cards go: the app's chapter deck while `auto` is on, else the learner's own choice —
 * remembered across the toggle, so switching "Include in decks" on and straight off again gives
 * back the deck they arrived with rather than throwing it away.
 */
export function useVersePlacement(
  deckId: string | undefined,
  auto: boolean,
  chapterName: string,
  decks: readonly Deck[],
): VersePlacement {
  const [choice, setChoice] = useState<VerseTarget>(
    deckId ? { kind: 'deck', deckId } : { kind: 'newDeck', name: '' },
  )
  const [sheet, setSheet] = useState<BibleImportSheet | null>(null)

  // An unnamed new deck takes the chapter's name and follows it: named once at the toggle, a deck
  // for chapter 2 would still be called "Geneza 1". A name the learner gave is left alone.
  const target: VerseTarget = auto
    ? { kind: 'automatic' }
    : choice.kind === 'newDeck' && !choice.name.trim()
      ? { kind: 'newDeck', name: chapterName }
      : choice

  return {
    target,
    destination:
      target.kind === 'deck'
        ? (decks.find((deck) => deck.id === target.deckId)?.name ?? null)
        : target.kind === 'newDeck'
          ? target.name
          : null,
    pickDeck: (picked) => setChoice({ kind: 'deck', deckId: picked }),
    nameDeck: (name) => setChoice({ kind: 'newDeck', name }),
    sheet,
    showSheet: setSheet,
  }
}
