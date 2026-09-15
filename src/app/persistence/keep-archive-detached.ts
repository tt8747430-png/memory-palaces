import { type DeckStore, selectDecks, strandedArchivedIds } from '@/entities/deck'
import { detachArchivedDecks } from '@/features/deck'
import { selectIsReady } from '@/shared/lib'

export function keepArchiveDetached(store: DeckStore): () => void {
  let running = false
  const check = () => {
    const state = store.getState()
    if (running || !selectIsReady(state)) return
    if (strandedArchivedIds(selectDecks(state)).length === 0) return
    running = true
    queueMicrotask(() => {
      void detachArchivedDecks(store).finally(() => {
        running = false
      })
    })
  }
  check()
  return store.subscribe(check)
}
