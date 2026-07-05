import { lociForRoom, type Locus, type LocusStore, makeLocus, selectLoci } from '@/entities/locus'
import { nextOrder, type SrsState } from '@/shared/lib'

export interface CreateLocusInput {
  front: string
  back: string
  hint?: string
  tip?: string
  /** Restored on import (Mindscape full-fidelity); left unset for a hand-created card. */
  flagged?: boolean
  memorized?: boolean
  srs?: SrsState
}

/** Command — add a locus to a room. The single write-path (UI + import + future Tutor); new
 * cards append to the end of the room's order. Import carries the optional flag/known/schedule
 * fields through; the editor leaves them unset so a new card starts fresh. */
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
