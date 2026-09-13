import { type DeckStore, selectDecks, strandedArchivedIds } from '@/entities/deck'
import { detachArchivedDecks } from '@/features/deck'
import { selectIsReady } from '@/shared/lib'

/**
 * Keeps the archive a place (ADR 0003) for as long as the app runs. Decks archived in place — stored
 * before the rule, or replicated in later from a build that predates it — are lifted out as soon as
 * the store holds them, not only at start, so no delete aimed at the place they left can reach them.
 *
 * Not a schema migration: the document shape did not change, and a per-document strategy cannot see
 * whether a deck's parent went into the archive with it. One pass runs at a time; its own writes
 * wake the check again, which then finds nothing. A pass whose write fails is retried on the next
 * snapshot, never in a loop.
 */
export function keepArchiveDetached(store: DeckStore): () => void {
  let running = false
  const check = () => {
    const state = store.getState()
    if (running || !selectIsReady(state)) return
    if (strandedArchivedIds(selectDecks(state)).length === 0) return
    running = true
    // Never write from inside a store notification: the snapshot being delivered may be the first,
    // handed over before the repository has registered the listener that would carry the write back.
    queueMicrotask(() => {
      void detachArchivedDecks(store).finally(() => {
        running = false
      })
    })
  }
  check()
  return store.subscribe(check)
}
