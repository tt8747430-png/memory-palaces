import { type Palace, type PalaceChanges, type PalaceStore, updatePalace } from '@/entities/palace'
import { requirePalace } from './require-palace'

/** Command — edit a palace. Applies the changes through the entity's invariant
 * check and persists; the reactive store reflects the result. */
export async function editPalace(
  store: PalaceStore,
  id: string,
  changes: PalaceChanges,
): Promise<Palace> {
  const existing = requirePalace(store, id)
  const updated = updatePalace(existing, changes, new Date().toISOString())
  await store.getState().save(updated)
  return updated
}
