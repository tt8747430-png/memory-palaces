export const CONTENT_SORTS = ['manual', 'recent', 'name', 'due', 'flagged'] as const

/** How a list of study content is arranged. Persisted, so the strings are stable. */
export type ContentSort = (typeof CONTENT_SORTS)[number]

export interface SortableContent {
  createdAt: string
  srs?: { due?: string }
  flagged?: boolean
}

/**
 * The one arrangement of study content. `title` names whatever a row leads with — a card's front, a
 * question's prompt — so every list answers "by name" the same way; `manual` hands the list back
 * untouched, keeping the `order` the collection store already sorted by.
 *
 * Sorts a subject cannot express fall through to that stored order: a question has no schedule and
 * no flag, so `due` and `flagged` leave it be (sort is stable, so equal keys hold position).
 */
export function sortContent<T extends SortableContent>(
  items: T[],
  sort: ContentSort,
  title: (item: T) => string,
): T[] {
  switch (sort) {
    case 'name':
      return [...items].sort((a, b) => title(a).localeCompare(title(b)))
    case 'recent':
      return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'due':
      return [...items].sort((a, b) => (a.srs?.due ?? '').localeCompare(b.srs?.due ?? ''))
    case 'flagged':
      return [...items].sort((a, b) => Number(b.flagged ?? false) - Number(a.flagged ?? false))
    case 'manual':
      return items
  }
}
