import {
  HISTORY_CAP,
  type HistoryStore,
  historyOverCap,
  selectHistory,
} from '@/entities/learning-history'
import { selectIsReady } from '@/shared/lib'

export function keepHistoryCapped(store: HistoryStore): () => void {
  let running = false
  const check = () => {
    const state = store.getState()
    if (running || !selectIsReady(state)) return
    const stale = historyOverCap(selectHistory(state), HISTORY_CAP)
    if (stale.length === 0) return
    running = true
    queueMicrotask(() => {
      void Promise.all(stale.map((entry) => store.getState().remove(entry.id))).finally(() => {
        running = false
      })
    })
  }
  check()
  return store.subscribe(check)
}
