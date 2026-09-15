import { type DeckStore, LIBRARY_TOP } from '@/entities/deck'
import { relocateDecks } from './relocate-decks'

export async function archiveDecks(
  store: DeckStore,
  ids: readonly string[],
  at = Date.now(),
): Promise<void> {
  await relocateDecks(
    store,
    ids.map((id) => ({ id, to: LIBRARY_TOP })),
    { archived: true, at },
  )
}
