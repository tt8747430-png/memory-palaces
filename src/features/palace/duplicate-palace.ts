import { cloneEntity } from '@/shared/lib'
import type { Palace, PalaceStore } from '@/entities/palace'
import { requirePalace } from './require-palace'

/** Command — duplicate a palace (Prototype). Deep-clones with a fresh identity +
 * timestamps and a "(copy)" name; rooms/loci cascade is a later, deeper concern. */
export async function duplicatePalace(store: PalaceStore, id: string): Promise<Palace> {
  const original = requirePalace(store, id)
  const copy: Palace = {
    ...cloneEntity(original, crypto.randomUUID(), new Date().toISOString()),
    name: `${original.name} (copy)`,
  }
  await store.getState().save(copy)
  return copy
}
