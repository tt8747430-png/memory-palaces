import { type DeckStore, selectDecks, strandedArchivedIds } from '@/entities/deck'
import { archiveDecks } from './archive-decks'

export async function detachArchivedDecks(store: DeckStore, at = Date.now()): Promise<void> {
  const stranded = strandedArchivedIds(selectDecks(store.getState()))
  if (stranded.length === 0) return
  await archiveDecks(store, stranded, at)
}
