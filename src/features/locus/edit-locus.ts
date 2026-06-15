import { updateLocus, type Locus, type LocusChanges, type LocusStore } from '@/entities/locus'
import { requireLocus } from './require-locus'

/** Command — edit a locus (front/back/hint/tip/flagged/memorized). Runs through the
 * entity's invariant check and persists; the reactive store reflects the result. */
export async function editLocus(
  store: LocusStore,
  id: string,
  changes: LocusChanges,
): Promise<Locus> {
  const existing = requireLocus(store, id)
  const updated = updateLocus(existing, changes, new Date().toISOString())
  await store.getState().save(updated)
  return updated
}
