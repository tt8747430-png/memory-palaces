import type { Card } from '@/entities/card'
import type { ContentSort } from '@/entities/preferences'
import { sortContent, srsStatus } from '@/shared/lib'

export type MaturityKey = 'new' | 'learning' | 'known'

export interface CardFilter {
  maturity: ReadonlySet<MaturityKey>
  flaggedOnly: boolean
}

export const EMPTY_CARD_FILTER: CardFilter = { maturity: new Set(), flaggedOnly: false }

export const cardFilterCount = (filter: CardFilter): number =>
  filter.maturity.size + (filter.flaggedOnly ? 1 : 0)

export const sortCards = (cards: Card[], sort: ContentSort): Card[] =>
  sortContent(cards, sort, (card) => card.front)

const SEARCHABLE = ['front', 'back', 'hint', 'tip'] as const

export function filterCards(cards: Card[], needle: string, filter: CardFilter): Card[] {
  let list = cards
  if (needle) {
    list = list.filter((card) =>
      SEARCHABLE.some((field) => card[field]?.toLowerCase().includes(needle)),
    )
  }
  if (filter.maturity.size > 0) list = list.filter((c) => filter.maturity.has(srsStatus(c.srs)))
  if (filter.flaggedOnly) list = list.filter((c) => c.flagged)
  return list
}
