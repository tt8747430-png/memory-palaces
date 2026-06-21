import { lociForRoom, makeLocus, selectLoci, type Locus, type LocusStore } from '@/entities/locus'
import { nextOrder } from '@/shared/lib'

export interface CreateLocusInput {
  front: string
  back: string
  hint?: string
  tip?: string
}

/** Command — add a locus to a room. The single write-path (UI + future Tutor); new cards
 * append to the end of the room's order. */
export async function createLocus(
  store: LocusStore,
  roomId: string,
  input: CreateLocusInput,
): Promise<Locus> {
  const order = nextOrder(lociForRoom(selectLoci(store.getState()), roomId))
  const locus = makeLocus({
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    roomId,
    order,
  })
  await store.getState().save(locus)
  return locus
}
