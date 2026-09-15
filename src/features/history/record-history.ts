import {
  HISTORY_CAP,
  type HistoryEntry,
  type HistoryStore,
  historyOverCap,
  makeHistoryEntry,
  type MakeHistoryEntryInput,
  selectHistory,
} from '@/entities/learning-history'
import { newId, nowIso } from '@/shared/lib'

export type HistoryDraft = Omit<MakeHistoryEntryInput, 'id' | 'createdAt'>

/**
 * Writes one answer to the Learning history and keeps it inside its cap.
 *
 * Its own slice rather than a helper inside `features/review`, because two slices write history —
 * a Review and a Fast-review answer from `features/review`, a Mastered mark from `features/card` —
 * and a helper reached across from one of them would have closed a circular import between the two.
 */
export async function recordHistory(
  store: HistoryStore,
  draft: HistoryDraft,
  now: number = Date.now(),
): Promise<HistoryEntry> {
  const entry = makeHistoryEntry({ ...draft, id: newId(), createdAt: nowIso(now) })
  await store.getState().save(entry)
  await trimToCapacity(store)
  return entry
}

/** The same write for a whole batch — marking a selection Mastered is one action, not N. */
export async function recordHistoryBatch(
  store: HistoryStore,
  drafts: readonly HistoryDraft[],
  now: number = Date.now(),
): Promise<HistoryEntry[]> {
  const entries = drafts.map((draft) =>
    makeHistoryEntry({ ...draft, id: newId(), createdAt: nowIso(now) }),
  )
  await Promise.all(entries.map((entry) => store.getState().save(entry)))
  await trimToCapacity(store)
  return entries
}

async function trimToCapacity(store: HistoryStore): Promise<void> {
  const stale = historyOverCap(selectHistory(store.getState()), HISTORY_CAP)
  await Promise.all(stale.map((entry) => store.getState().remove(entry.id)))
}
