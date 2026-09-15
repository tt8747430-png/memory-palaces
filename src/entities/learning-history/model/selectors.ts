import type { HistoryEntry } from './types'
import type { HistoryState } from './store'

export const selectHistory = (state: HistoryState): HistoryEntry[] => state.history

/**
 * One Card's entries, newest first. A pure filter rather than a selector factory: a selector that
 * built a fresh array on every store read would never compare equal to the last one, so screens
 * call this inside a `useMemo` over `selectHistory`.
 */
export function historyForCard(entries: readonly HistoryEntry[], cardId: string): HistoryEntry[] {
  return entries.filter((entry) => entry.cardId === cardId)
}

/** The entries past the cap — the oldest, because the store holds the history newest first. */
export function historyOverCap(entries: readonly HistoryEntry[], cap: number): HistoryEntry[] {
  return entries.slice(cap)
}
