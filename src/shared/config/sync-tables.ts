/**
 * Everything that mirrors to the cloud.
 *
 * `notifications` is ephemeral UI state and stays on the device, and so do `pendingChanges` and
 * `syncState` — the device's own bookkeeping about the cloud cannot itself be in the cloud, or
 * every device would inherit every other device's idea of what is pending.
 *
 * `history` is here and is *not* a content collection: it records no pending change, so it never
 * reaches the banner's count or the classifier, which is right — an entry is one answer at one
 * moment and is never edited, so it cannot diverge.
 *
 * It lives in `shared/config` rather than in the composition root because three layers need the
 * same list: the composition root builds a replication per entry, the sync-state entity keys its
 * checkpoints by it, and the peek walks it.
 */
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

/**
 * The collections whose writes are recorded as pending changes, and the only ones a Sync can ever
 * ask the user about.
 *
 * Deliberately not every synced table. `progress`, `preferences` and `profiles` are singletons that
 * always merge and can never diverge destructively, so counting them would inflate the banner with
 * changes nobody can be asked a question about. This is the whole filter — there is no second,
 * hidden one further down.
 *
 * Ordered outermost first — folders hold decks, decks hold cards and questions — which is the order
 * the review dialog groups them in.
 */
export const CONTENT_COLLECTIONS = ['folders', 'decks', 'cards', 'questions'] as const

export type ContentCollection = (typeof CONTENT_COLLECTIONS)[number]

/** The two content collections that carry descendants, so deleting one takes other documents with it. */
export const CONTAINER_COLLECTIONS: readonly ContentCollection[] = ['decks', 'folders']

/**
 * The key one content document is known by across the sync: its pending change's id, and the
 * review dialog's row key. One builder, so the two can never disagree about which document is which.
 */
export const contentKey = (collection: ContentCollection, id: string): string =>
  `${collection}:${id}`
