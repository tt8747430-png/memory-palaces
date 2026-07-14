import type { FolderStore } from '@app/decks/data/stores'
import type { DeckStore } from '@app/decks/data/stores'
import type { CardStore } from '@app/decks/data/stores'
import type { QuestionStore } from '@app/decks/data/stores'

export interface ContentStores {
  folderStore: FolderStore
  deckStore: DeckStore
  cardStore: CardStore
  questionStore: QuestionStore
}

async function removeEach(ids: string[], remove: (id: string) => Promise<void>): Promise<void> {
  for (const id of ids) await remove(id)
}

export async function clearAllContent({
  folderStore,
  deckStore,
  cardStore,
  questionStore,
}: ContentStores): Promise<void> {
  await removeEach(
    questionStore.questions().map((q) => q.id),
    (id) => questionStore.remove(id),
  )
  await removeEach(
    cardStore.cards().map((c) => c.id),
    (id) => cardStore.remove(id),
  )
  await removeEach(
    deckStore.decks().map((d) => d.id),
    (id) => deckStore.remove(id),
  )
  await removeEach(
    folderStore.folders().map((f) => f.id),
    (id) => folderStore.remove(id),
  )
}
