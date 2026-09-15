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
  /** Null for a guest, or with no cloud configured — there is then no stored object to orphan. */
  userId: string | null
}

/**
 * Deletes a deck with everything inside it — subdecks, cards, questions — and the cover images none
 * of them point at any more.
 *
 * Questions used to be left behind: they belonged to a deck that no longer existed, invisible
 * everywhere, still counted by nothing and still synced. They also broke the Sync's promise that a
 * deleted deck took every child on the device with it, which is what lets a remote edit to one of
 * those children be asked about as a deletion of its own.
 *
 * The object cleanup is best-effort on purpose: offline there is nothing to delete against, and a
 * failure must not stop the deck from being deleted. Nothing is lost by leaving one behind, because
 * the account purge empties the whole prefix as its first step.
 */
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
