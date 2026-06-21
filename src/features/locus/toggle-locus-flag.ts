import { updateLocus, type Locus, type LocusStore } from '@/entities/locus'
import { requireLocus } from './require-locus'

/** Command — flip a card's "flagged" mark (come back to this). */
export async function toggleLocusFlag(store: LocusStore, id: string): Promise<Locus> {
  const locus = requireLocus(store, id)
  const updated = updateLocus(locus, { flagged: !locus.flagged }, new Date().toISOString())
  await store.getState().save(updated)
  return updated
}
