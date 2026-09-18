import type { StoreApi } from 'zustand/vanilla'
import type { Repository } from '@/shared/api'
import { type CollectionState, createCollectionStore } from '@/shared/lib'
import { type BibleVerse, completeBibleVerse } from './verse'

export type BibleVerseState = CollectionState<'verses', BibleVerse>
export type BibleVerseStore = StoreApi<BibleVerseState>

const byPosition = (a: BibleVerse, b: BibleVerse): number =>
  a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verse - b.verse

export function createBibleVerseStore(repo: Repository<BibleVerse>): BibleVerseStore {
  return createCollectionStore('verses', repo, byPosition, { complete: completeBibleVerse })
}
