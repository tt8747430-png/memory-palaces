import type { Palace, PalaceStore } from '@/entities/palace'

/** Read a palace from the store's reactive state, or fail loudly. Edit/duplicate
 * commands run against a started store, so the list is already hydrated. */
export function requirePalace(store: PalaceStore, id: string): Palace {
  const palace = store.getState().palaces.find((candidate) => candidate.id === id)
  if (!palace) throw new Error(`Palace not found: ${id}`)
  return palace
}
