import { type HistoryStore, historyForCard, selectHistory } from '@/entities/learning-history'

/**
 * Drops every entry for these Cards. Reset progress is what reaches here: it clears the schedule
 * and the Fast-review bucket, so leaving the history standing would leave a record describing a
 * schedule the Card no longer has.
 */
export async function forgetCardHistory(
  store: HistoryStore,
  cardIds: readonly string[],
): Promise<void> {
  const entries = selectHistory(store.getState())
  const stale = cardIds.flatMap((cardId) => historyForCard(entries, cardId))
  await Promise.all(stale.map((entry) => store.getState().remove(entry.id)))
}
