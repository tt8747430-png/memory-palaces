import type { LocusStore } from '@/entities/locus'

/** Command — delete a locus. Idempotent (removing a missing locus is a no-op). */
export async function deleteLocus(store: LocusStore, id: string): Promise<void> {
  await store.getState().remove(id)
}
