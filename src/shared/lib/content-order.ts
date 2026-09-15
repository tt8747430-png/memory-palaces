export const CONTENT_SORTS = ['manual', 'recent', 'name', 'due', 'flagged'] as const

export type ContentSort = (typeof CONTENT_SORTS)[number]

export interface SortableContent {
  createdAt: string
  srs?: { due?: string }
  flagged?: boolean
}

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
