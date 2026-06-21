import { updateLocus, type LocusStore } from '@/entities/locus'

/** Command — clear the spaced-repetition schedule of the given loci, returning them to
 * "new". Serves both the single-row "Reset schedule" and the multi-select bulk action. */
export async function resetLociSrs(store: LocusStore, ids: ReadonlyArray<string>): Promise<void> {
  const updatedAt = new Date().toISOString()
  const targets = new Set(ids)
  const loci = store.getState().loci.filter((locus) => targets.has(locus.id))
  await Promise.all(
    loci.map((locus) => store.getState().save(updateLocus(locus, { srs: undefined }, updatedAt))),
  )
}
