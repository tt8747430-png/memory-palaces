import { type DeckStore, LIBRARY_TOP } from '@/entities/deck'
import { relocateDecks } from './relocate-decks'

/**
 * The archive is a place, not a flag on a deck left where it stood (ADR 0003). Archiving lifts each
 * deck — its subdecks travel with it — out of its folder or parent deck, so nothing later done to
 * the place it left reaches it: a deleted folder does not take it, a parent deck's study session
 * does not count its cards.
 */
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
