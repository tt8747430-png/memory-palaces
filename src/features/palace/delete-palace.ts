import type { PalaceStore } from '@/entities/palace'

/** Command — delete a palace. Idempotent (removing a missing palace is a no-op). */
export async function deletePalace(store: PalaceStore, id: string): Promise<void> {
  await store.getState().remove(id)
}
