import { type DeckStore, selectDecks } from '@/entities/deck'
import { type PreferencesStore, selectSubdeckSorts } from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'
import { selectIsReady } from '@/shared/lib'

export interface SubdeckOrderKeeperDeps {
  deckStore: DeckStore
  preferencesStore: PreferencesStore
}

/**
 * An order chosen for one deck's subdecks belongs to that deck. Delete the deck and the entry
 * would sit in `preferences.subdeckSorts` for ever — on this device and, once Synchronised, on
 * every other. Nothing in the preferences document can tell on its own whether `d7` still exists,
 * so this is a keeper: it needs both collections to answer.
 *
 * An **archived** deck keeps its order. The archive is a place outside the Library (ADR 0003), not
 * a deletion — the deck comes back with the arrangement it left with.
 */
export function keepSubdeckOrdersOwned({
  deckStore,
  preferencesStore,
}: SubdeckOrderKeeperDeps): () => void {
  let running = false

  const check = () => {
    const decks = deckStore.getState()
    const prefs = preferencesStore.getState()
    // Before either has mirrored, "no decks" would be a guess, and every entry an orphan.
    if (running || !selectIsReady(decks) || !selectIsReady(prefs)) return

    const held = selectSubdeckSorts(prefs)
    const ids = Object.keys(held)
    if (ids.length === 0) return
    const live = new Set(selectDecks(decks).map((deck) => deck.id))
    const orphans = ids.filter((id) => !live.has(id))
    if (orphans.length === 0) return

    running = true
    const owned = Object.fromEntries(ids.filter((id) => live.has(id)).map((id) => [id, held[id]!]))
    queueMicrotask(() => {
      void setPreferences(preferencesStore, { subdeckSorts: owned }).finally(() => {
        running = false
      })
    })
  }

  check()
  const stopDecks = deckStore.subscribe(check)
  const stopPreferences = preferencesStore.subscribe(check)
  return () => {
    stopDecks()
    stopPreferences()
  }
}
