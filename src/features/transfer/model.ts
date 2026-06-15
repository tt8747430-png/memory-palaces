/** A portable card: a locus stripped of identity, room, and timestamps. The unit
 * every transfer format reads and writes. */
export interface LocusDraft {
  front: string
  back: string
  hint?: string
  tip?: string
}

/**
 * Strategy for one transfer format (Adapter/Strategy). Add a format by adding a
 * strategy — `exportLoci`/`importLoci` never change. An Anki (.apkg) strategy is a
 * future addition here (needs sql.js + fflate; deferred).
 */
export interface TransferStrategy {
  id: string
  serialize: (cards: LocusDraft[]) => string
  parse: (text: string) => LocusDraft[]
}
