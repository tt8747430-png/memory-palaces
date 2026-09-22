import type { HistoryEntry } from './types'
import type { HistoryState } from './store'

export const selectHistory = (state: HistoryState): HistoryEntry[] => state.history

export function historyForCard(entries: readonly HistoryEntry[], cardId: string): HistoryEntry[] {
  return entries.filter((entry) => entry.cardId === cardId)
}
