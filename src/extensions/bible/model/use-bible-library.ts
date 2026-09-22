import { selectIsReady } from '@/shared/lib'
import { useBibleVerseStore } from './context'
import { CORNILESCU_2024, type Translation } from './translations'

export interface BibleLibrary {
  ready: boolean
  translation: Translation
}

/**
 * What the overview says about the Bible library: which translation it is. What it holds, and
 * filling it, are developer matters (`useBibleDeveloper`) — the corpus is shared by every account.
 */
export function useBibleLibrary(): BibleLibrary {
  return { ready: useBibleVerseStore(selectIsReady), translation: CORNILESCU_2024 }
}
