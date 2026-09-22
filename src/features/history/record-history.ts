import {
  type HistoryEntry,
  type HistoryStore,
  makeHistoryEntry,
  type MakeHistoryEntryInput,
} from '@/entities/learning-history'
import { newId, nowIso } from '@/shared/lib'

export type HistoryDraft = Omit<MakeHistoryEntryInput, 'id' | 'createdAt'>

/** Writing does not trim: the cap has to see every entry at once, so `keepCapped` owns it. */
export async function recordHistory(
  store: HistoryStore,
  draft: HistoryDraft,
  now: number = Date.now(),
): Promise<HistoryEntry> {
  const entry = makeHistoryEntry({ ...draft, id: newId(), createdAt: nowIso(now) })
  await store.getState().save(entry)
  return entry
}

export async function recordHistoryBatch(
  store: HistoryStore,
  drafts: readonly HistoryDraft[],
  now: number = Date.now(),
): Promise<HistoryEntry[]> {
  const entries = drafts.map((draft) =>
    makeHistoryEntry({ ...draft, id: newId(), createdAt: nowIso(now) }),
  )
  await Promise.all(entries.map((entry) => store.getState().save(entry)))
  return entries
}
