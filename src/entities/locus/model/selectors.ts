import type { Locus } from './types'
import type { LocusState } from './store'

export const selectLoci = (state: LocusState): Locus[] => state.loci
export const selectIsReady = (state: LocusState): boolean => state.status === 'ready'

/** Pure: the loci of one room, in creation order. Compose in a component with
 * `useMemo(() => lociForRoom(loci, roomId), [loci, roomId])`. */
export const lociForRoom = (loci: Locus[], roomId: string): Locus[] =>
  loci.filter((locus) => locus.roomId === roomId)
