import type { BibleVerse } from '../model/verse'
import type { BibleVerseStore } from '../model/store'

/** Keeps verses in the on-device library. Returns how many were written. */
export async function publishVerses(
  store: BibleVerseStore,
  verses: readonly BibleVerse[],
): Promise<number> {
  for (const verse of verses) await store.getState().save(verse)
  return verses.length
}
