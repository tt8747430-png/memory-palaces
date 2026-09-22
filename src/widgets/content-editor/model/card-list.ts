import type { Card } from '@/entities/card'
import type { ContentSort } from '@/entities/preferences'
import type { LearningAlgorithm } from '@/shared/config/algorithms'
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

export interface CardListOptions {
  /** The orders that can change this list. */
  sorts: ReadonlySet<ContentSort>
  /** The maturity buckets worth offering — one holding every card narrows nothing. */
  maturity: ReadonlySet<MaturityKey>
  /** Some cards are flagged and some are not, so both the filter and the order mean something. */
  flagged: boolean
  /** Anything at all to filter by. Nothing, and the Filter button itself has no work to do. */
  any: boolean
}

const ALWAYS: readonly ContentSort[] = ['manual', 'recent', 'name']

/**
 * What this list of cards can be sorted and filtered by. An option that would hand the list back
 * exactly as it is — `due` on a deck that schedules nothing, a bucket that holds every card, a
 * flag nobody has set — is not offered, so the controls say what this deck can do.
 *
 * One pass over the cards: a deck can hold thousands, and this runs on every keystroke of the
 * search field above it.
 */
export function cardListOptions(
  cards: readonly Card[],
  algorithm: LearningAlgorithm,
): CardListOptions {
  const buckets = new Map<MaturityKey, number>()
  let flagged = 0
  let scheduled = 0
  for (const card of cards) {
    if (card.flagged) flagged += 1
    const status = srsStatus(card.srs)
    if (status !== 'new') scheduled += 1
    buckets.set(status, (buckets.get(status) ?? 0) + 1)
  }

  const maturity = new Set<MaturityKey>()
  for (const [key, count] of buckets) {
    if (count < cards.length) maturity.add(key)
  }

  const sorts = new Set<ContentSort>(ALWAYS)
  // Sorting by due date needs schedules to sort; a Fast deck keeps an outcome, not a date.
  if (algorithm === 'spaced' && scheduled > 0) sorts.add('due')
  const mixedFlags = flagged > 0 && flagged < cards.length
  if (mixedFlags) sorts.add('flagged')

  return { sorts, maturity, flagged: mixedFlags, any: maturity.size > 0 || mixedFlags }
}

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
