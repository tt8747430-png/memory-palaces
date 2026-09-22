import { useMemo } from 'react'
import type { Deck } from '@/entities/deck'
import type { Folder } from '@/entities/folder'

export interface RowAvailability {
  /** Somewhere for a deck to go: another live deck to sit under, or a folder. */
  canMoveDecks: boolean
  /** This deck carries a live subdeck, so it has an order of its own to arrange. */
  hasSubdecks: (deckId: string) => boolean
}

export interface RowAvailabilityArgs {
  decks: readonly Deck[]
  folders: readonly Folder[]
}

/**
 * Which row actions the Library can offer at all. The page owns the surfaces an action opens; this
 * owns the question of whether to offer it, because that is a fact about the library rather than
 * about the row under the thumb (CODE_STYLE §2, §3a).
 *
 * The parent ids are gathered once into a Set. Asked per row instead — which is how this started
 * life in the page — it is a scan per row, so a library of a few hundred decks pays for a few tens
 * of thousands of comparisons on every render.
 */
export function useRowAvailability({ decks, folders }: RowAvailabilityArgs): RowAvailability {
  return useMemo(() => {
    const withLiveSubdeck = new Set<string>()
    let liveDecks = 0
    for (const deck of decks) {
      if (deck.archived) continue
      liveDecks += 1
      if (deck.parentId !== null) withLiveSubdeck.add(deck.parentId)
    }
    // A folder is somewhere to go both ways round: a deck outside one can move in, and a deck
    // already in one can move out to the Library.
    return {
      canMoveDecks: folders.length > 0 || liveDecks > 1,
      hasSubdecks: (deckId) => withLiveSubdeck.has(deckId),
    }
  }, [decks, folders])
}
