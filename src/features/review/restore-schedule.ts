import type { SrsState } from '@/shared/lib'
import type { Locus, LocusStore } from '@/entities/locus'

/**
 * Command — reverse a graded card's SRS write by restoring the schedule it held
 * before the grade. Paired with the session machine's `undo`: the widget captures
 * each card's prior `srs` as it grades, then hands it back here on undo. `undefined`
 * is a first-ever grade being undone, returning the card to brand-new. `now` is
 * injected so `updatedAt` rides the same clock as the rest of the write-path.
 */
export async function restoreSchedule(
  store: LocusStore,
  locusId: string,
  srs: SrsState | undefined,
  now: number = Date.now(),
): Promise<Locus> {
  const existing = store.getState().loci.find((locus) => locus.id === locusId)
  if (!existing) throw new Error(`Locus not found: ${locusId}`)
  const restored: Locus = {
    ...existing,
    srs,
    updatedAt: new Date(now).toISOString(),
  }
  await store.getState().save(restored)
  return restored
}
