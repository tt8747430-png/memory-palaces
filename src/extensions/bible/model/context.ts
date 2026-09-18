import { useStore } from 'zustand'
import { useExtensionServices } from '@/shared/lib'
import { BIBLE_ID } from '../ids'
import type { BibleVerseState, BibleVerseStore } from './store'

/** What the Bible extension's `activate` publishes, and its screens read. */
export interface BibleServices {
  verseStore: BibleVerseStore
}

export function useBibleVerseStoreApi(): BibleVerseStore {
  return useExtensionServices<BibleServices>(BIBLE_ID).verseStore
}

export function useBibleVerseStore<T>(selector: (state: BibleVerseState) => T): T {
  return useStore(useBibleVerseStoreApi(), selector)
}
