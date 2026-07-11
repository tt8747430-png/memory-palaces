import type { FolderStore } from '@/entities/folder'
import type { DeckStore } from '@/entities/deck'
import type { CardStore } from '@/entities/card'
import type { QuestionStore } from '@/entities/question'

export interface ContentStores {
  folderStore: FolderStore
  deckStore: DeckStore
  cardStore: CardStore
  questionStore: QuestionStore
}

async function removeEach(ids: string[], remove: (id: string) => Promise<void>): Promise<void> {
  for (const id of ids) await remove(id)
}

/** Command — delete every folder and deck with all their cards and questions. Children are
 * removed first so nothing is left pointing at a deleted parent. */
export async function clearAllContent({
  folderStore,
  deckStore,
  cardStore,
  questionStore,
}: ContentStores): Promise<void> {
  await removeEach(
    questionStore.getState().questions.map((q) => q.id),
    (id) => questionStore.getState().remove(id),
  )
  await removeEach(
    cardStore.getState().cards.map((c) => c.id),
    (id) => cardStore.getState().remove(id),
  )
  await removeEach(
    deckStore.getState().decks.map((d) => d.id),
    (id) => deckStore.getState().remove(id),
  )
  await removeEach(
    folderStore.getState().folders.map((f) => f.id),
    (id) => folderStore.getState().remove(id),
  )
}
