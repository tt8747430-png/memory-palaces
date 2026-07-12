import type { CardStore } from '@/entities/card'
import type { QuestionStore } from '@/entities/question'
import { createCard } from '@/features/card'
import { createQuestion } from '@/features/question'
import type { DeckContentData } from '@/shared/lib'

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
