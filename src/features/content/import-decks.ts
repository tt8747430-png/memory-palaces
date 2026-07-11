import type { ImportedDeck } from '@/shared/lib'
import type { DeckStore } from '@/entities/deck'
import type { CardStore } from '@/entities/card'
import type { QuestionStore } from '@/entities/question'
import { createDeck } from '@/features/deck'
import { applyDeckContent } from './apply-content'

export interface ImportDecksResult {
  decks: number
  cards: number
  questions: number
}

/**
 * Command — bring whole decks in as subdecks of a parent deck (or as top-level decks with
 * `parentId: null`). Each incoming deck is created (appended in order) and then filled with
 * its cards and questions through the create commands, so imports are indistinguishable from
 * hand-made content. Backs the "Import decks" sheet (a verse paste, an Anki/CSV deck, or
 * another Mindscape export).
 */
export async function importDecks(
  deckStore: DeckStore,
  cardStore: CardStore,
  questionStore: QuestionStore,
  parentId: string | null,
  decks: ReadonlyArray<ImportedDeck>,
): Promise<ImportDecksResult> {
  let cards = 0
  let questions = 0
  for (const incoming of decks) {
    const deck = await createDeck(deckStore, {
      name: incoming.title,
      description: incoming.description,
      parentId,
    })
    const applied = await applyDeckContent(cardStore, questionStore, deck.id, {
      cards: incoming.cards,
      questions: incoming.questions,
    })
    cards += applied.cards
    questions += applied.questions
  }
  return { decks: decks.length, cards, questions }
}
