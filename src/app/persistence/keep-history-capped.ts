import {
  HISTORY_CAP,
  type HistoryStore,
  historyOverCap,
  selectHistory,
} from '@/entities/learning-history'
import { selectIsReady } from '@/shared/lib'

/**
 * Keeps the Learning history inside `HISTORY_CAP` for as long as the app runs.
 *
 * `recordHistory` already trims on every write, which is enough for a history that only ever grows
 * one answer at a time. It is not enough for one that is *already* over: a device that studied
 * under a build with a higher cap, or one whose last trim never landed, would sit above the cap
 * until the next answer, and shed only one entry per answer after that. Trimming is also a repair
 * no single document can decide — it is the *other* entries that say whether this one is past the
 * cap — which is what puts it here rather than in a migration strategy (CLAUDE.md).
 *
 * One pass runs at a time; its own writes wake the check again, which then finds nothing.
 *
 * The server has a cap of its own now (`trim_history`, the same 2000), and neither is sufficient
 * alone: this one cannot see another device's entries, and that one cannot run while a device is
 * offline. Both trim by recency, so an entry pulled from the cloud that is older than the boundary
 * is simply dropped again rather than resurrecting anything.
 */
export function keepHistoryCapped(store: HistoryStore): () => void {
  let running = false
  const check = () => {
    const state = store.getState()
    if (running || !selectIsReady(state)) return
    const stale = historyOverCap(selectHistory(state), HISTORY_CAP)
    if (stale.length === 0) return
    running = true
    // Never write from inside a store notification: the snapshot being delivered may be the first,
    // handed over before the repository has registered the listener that would carry the write back.
    queueMicrotask(() => {
      void Promise.all(stale.map((entry) => store.getState().remove(entry.id))).finally(() => {
        running = false
      })
    })
  }
  check()
  return store.subscribe(check)
}
