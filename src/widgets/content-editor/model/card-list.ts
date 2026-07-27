import type { Card } from '@/entities/card'
import type { ContentSort } from '@/entities/preferences'
import { srsStatus } from '@/shared/lib'

export type MaturityKey = 'new' | 'learning' | 'known'

export interface CardFilter {
  maturity: ReadonlySet<MaturityKey>
  flaggedOnly: boolean
}

export const EMPTY_CARD_FILTER: CardFilter = { maturity: new Set(), flaggedOnly: false }

export const cardFilterCount = (filter: CardFilter): number =>
  filter.maturity.size + (filter.flaggedOnly ? 1 : 0)

const dueKey = (card: Card) => card.srs?.due ?? ''

/** `manual` is the stored order, so it is the one sort that returns the list untouched. */
export function sortCards(cards: Card[], sort: ContentSort): Card[] {
  switch (sort) {
    case 'name':
      return [...cards].sort((a, b) => a.front.localeCompare(b.front))
    case 'recent':
      return [...cards].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'due':
      return [...cards].sort((a, b) => dueKey(a).localeCompare(dueKey(b)))
    case 'flagged':
      return [...cards].sort((a, b) => Number(b.flagged) - Number(a.flagged))
    case 'manual':
      return cards
  }
}

const SEARCHABLE = ['front', 'back', 'hint', 'tip'] as const

/** Search then filter, in that order — narrowing is cheapest on the smaller list. */
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
