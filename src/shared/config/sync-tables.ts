export const SYNCED_TABLES = [
  'decks',
  'cards',
  'folders',
  'questions',
  'progress',
  'preferences',
  'profiles',
  'history',
] as const

export type SyncedTable = (typeof SYNCED_TABLES)[number]

export const CONTENT_COLLECTIONS = ['folders', 'decks', 'cards', 'questions'] as const

export type ContentCollection = (typeof CONTENT_COLLECTIONS)[number]

export const CONTAINER_COLLECTIONS: readonly ContentCollection[] = ['decks', 'folders']

export const contentKey = (collection: ContentCollection, id: string): string =>
  `${collection}:${id}`
