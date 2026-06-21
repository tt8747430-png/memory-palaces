import { lociForRoom, makeLocus, selectLoci, type Locus, type LocusStore } from '@/entities/locus'
import { nextOrder } from '@/shared/lib'
import { requireLocus } from './require-locus'

/** Command — copy a card's content (front/back/hint/tip) into a fresh card appended to
 * the room. The copy starts with a clean schedule, unflagged — it's a new card to edit,
 * not a clone of the original's progress. */
export async function duplicateLocus(store: LocusStore, id: string): Promise<Locus> {
  const original = requireLocus(store, id)
  const order = nextOrder(lociForRoom(selectLoci(store.getState()), original.roomId))
  const copy = makeLocus({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    roomId: original.roomId,
    front: original.front,
    back: original.back,
    hint: original.hint,
    tip: original.tip,
    order,
  })
  await store.getState().save(copy)
  return copy
}
