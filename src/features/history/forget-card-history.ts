import { type HistoryStore, historyForCard, selectHistory } from '@/entities/learning-history'

export async function forgetCardHistory(
  store: HistoryStore,
  cardIds: readonly string[],
): Promise<void> {
  const entries = selectHistory(store.getState())
  const stale = cardIds.flatMap((cardId) => historyForCard(entries, cardId))
  await Promise.all(stale.map((entry) => store.getState().remove(entry.id)))
}
