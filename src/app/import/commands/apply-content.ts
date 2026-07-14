import type { CardStore } from '@app/decks/data/stores'
import type { QuestionStore } from '@app/decks/data/stores'
import { createCard } from '@app/decks/commands/card-index'
import { createQuestion } from '@app/decks/commands/question-index'
import type { DeckContentData } from '@app/shared/domain'

export interface AppliedContent {
  cards: number
  questions: number
}

export async function applyDeckContent(
  cardStore: CardStore,
  questionStore: QuestionStore,
  deckId: string,
  data: DeckContentData,
): Promise<AppliedContent> {
  for (const card of data.cards) {
    await createCard(cardStore, deckId, card)
  }
  for (const question of data.questions) {
    await createQuestion(questionStore, deckId, question)
  }
  return { cards: data.cards.length, questions: data.questions.length }
}
