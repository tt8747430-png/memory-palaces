import { updateLocus, type LocusStore } from '@/entities/locus'
import { markKnown } from '@/shared/lib'

/** Command — force the given loci into a "known" (mastered) schedule. Serves both the
 * single-row "Mark as known" and the multi-select bulk action; one clock read keeps the
 * batch consistent. */
export async function markLociKnown(store: LocusStore, ids: ReadonlyArray<string>): Promise<void> {
  const now = Date.now()
  const updatedAt = new Date(now).toISOString()
  const targets = new Set(ids)
  const loci = store.getState().loci.filter((locus) => targets.has(locus.id))
  await Promise.all(
    loci.map((locus) =>
      store.getState().save(updateLocus(locus, { srs: markKnown(locus.srs, now) }, updatedAt)),
    ),
  )
}
