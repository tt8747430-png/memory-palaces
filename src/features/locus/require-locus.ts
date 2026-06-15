import type { Locus, LocusStore } from '@/entities/locus'

/** Read a locus from the store's reactive state, or fail loudly. */
export function requireLocus(store: LocusStore, id: string): Locus {
  const locus = store.getState().loci.find((candidate) => candidate.id === id)
  if (!locus) throw new Error(`Locus not found: ${id}`)
  return locus
}
