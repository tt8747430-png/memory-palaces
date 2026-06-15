import { makeLocus, type Locus, type LocusStore } from '@/entities/locus'

export interface CreateLocusInput {
  front: string
  back: string
  hint?: string
  tip?: string
}

/** Command — add a locus to a room. The single write-path (UI + future Tutor). */
export async function createLocus(
  store: LocusStore,
  roomId: string,
  input: CreateLocusInput,
): Promise<Locus> {
  const locus = makeLocus({
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    roomId,
  })
  await store.getState().save(locus)
  return locus
}
