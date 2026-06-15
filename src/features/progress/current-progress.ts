import { makeProgress, type Progress, type ProgressStore } from '@/entities/progress'

/** The one progress record's id — it is a singleton, so a fixed key prevents duplicates. */
export const PROGRESS_ID = 'progress'

/** The current progress record, or a fresh (unsaved) default when none exists yet.
 * Commands spread this, apply their change, and persist — so the singleton is created
 * lazily on the first award. */
export function currentProgress(store: ProgressStore, now: number): Progress {
  return (
    store.getState().progress ??
    makeProgress({ id: PROGRESS_ID, createdAt: new Date(now).toISOString() })
  )
}
