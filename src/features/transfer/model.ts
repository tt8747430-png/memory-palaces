/** A portable card: a card stripped of identity, deck, and timestamps. The unit
 * every transfer format reads and writes. */
export interface CardDraft {
  front: string
  back: string
  hint?: string
  tip?: string
}

/**
 * Strategy for one transfer format (Adapter/Strategy). Add a format by adding a
 * strategy — `exportCards`/`importCards` never change. An Anki (.apkg) strategy is a
 * future addition here (needs sql.js + fflate; deferred).
 */
export interface TransferStrategy {
  id: string
  serialize: (cards: CardDraft[]) => string
  parse: (text: string) => CardDraft[]
}
