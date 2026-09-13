import { type DeckStore, selectDecks, strandedArchivedIds } from '@/entities/deck'
import { archiveDecks } from './archive-decks'

/**
 * Lifts every archived deck still standing where it was archived from out to the archive's place
 * — decks written before the archive was a place, or replicated from a build that predates it.
 * A deck archived whole with its parent stays under it. Writes nothing once the archive is whole.
 */
export async function detachArchivedDecks(store: DeckStore, at = Date.now()): Promise<void> {
  const stranded = strandedArchivedIds(selectDecks(store.getState()))
  if (stranded.length === 0) return
  await archiveDecks(store, stranded, at)
}
