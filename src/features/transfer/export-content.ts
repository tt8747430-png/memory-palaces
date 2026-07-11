import type { Card } from '@/entities/card'
import type { CardDraft, TransferStrategy } from './model'

const toDraft = (card: Card): CardDraft => ({
  front: card.front,
  back: card.back,
  hint: card.hint,
  tip: card.tip,
})

/** Command — serialize a deck's cards to text in the chosen format. */
export function exportCards(cards: Card[], strategy: TransferStrategy): string {
  return strategy.serialize(cards.map(toDraft))
}
