import type { Locus } from '@/entities/locus'
import type { LocusDraft, TransferStrategy } from './model'

const toDraft = (locus: Locus): LocusDraft => ({
  front: locus.front,
  back: locus.back,
  hint: locus.hint,
  tip: locus.tip,
})

/** Command — serialize a room's loci to text in the chosen format. */
export function exportLoci(loci: Locus[], strategy: TransferStrategy): string {
  return strategy.serialize(loci.map(toDraft))
}
