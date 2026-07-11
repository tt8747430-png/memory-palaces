import type { CardStore } from '@/entities/card'
import type { QuestionStore } from '@/entities/question'
import { createCard } from '@/features/card'
import { createQuestion } from '@/features/question'
import type { RoomContentData } from '@/shared/lib'

export interface AppliedContent {
  cards: number
  questions: number
}

/**
 * Command — write parsed import content into a deck through the create commands, so imported
 * cards/questions get fresh ids, timestamps, and appended order like any other. Sequential by
 * design: each create reads the running order off the store.
 */
export async function applyDeckContent(
  cardStore: CardStore,
  questionStore: QuestionStore,
  deckId: string,
  data: RoomContentData,
): Promise<AppliedContent> {
  for (const card of data.loci) {
    await createCard(cardStore, deckId, card)
  }
  for (const question of data.questions) {
    await createQuestion(questionStore, deckId, question)
  }
  return { cards: data.loci.length, questions: data.questions.length }
}
