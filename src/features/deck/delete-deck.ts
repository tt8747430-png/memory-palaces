import type { StoragePort } from '@/shared/api'
import { type DeckStore, selectDecks } from '@/entities/deck'
import { type CardStore, selectCards } from '@/entities/card'
import { type QuestionStore, selectQuestions } from '@/entities/question'
import { subtreeDeckIds } from '@/shared/lib'

export interface DeleteDeckDeps {
  deckStore: DeckStore
  cardStore: CardStore
  questionStore: QuestionStore
  storage: StoragePort
  userId: string | null
}

export async function deleteDeck(
  { deckStore, cardStore, questionStore, storage, userId }: DeleteDeckDeps,
  id: string,
): Promise<void> {
  const deckIds = subtreeDeckIds(selectDecks(deckStore.getState()), id)
  const inSubtree = new Set(deckIds)
  const cards = selectCards(cardStore.getState()).filter((card) => inSubtree.has(card.deckId))
  const questions = selectQuestions(questionStore.getState()).filter((question) =>
    inSubtree.has(question.deckId),
  )
  await Promise.all([
    ...cards.map((card) => cardStore.getState().remove(card.id)),
    ...questions.map((question) => questionStore.getState().remove(question.id)),
  ])
  await Promise.all(deckIds.map((deckId) => deckStore.getState().remove(deckId)))
  if (!userId) return
  await Promise.all(
    deckIds.map((deckId) =>
      storage.remove({ bucket: 'deck-images', userId, entityId: deckId }).catch(() => {}),
    ),
  )
}
