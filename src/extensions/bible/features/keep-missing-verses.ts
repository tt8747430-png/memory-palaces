import type { BibleVerseStore } from '../model/store'
import type { BibleVerse } from '../model/verse'

/**
 * Saves into the Bible library the verses it does not hold yet. Never overwrites: a verse already
 * there keeps its text, whatever the source says. Returns how many were saved.
 */
export async function keepMissingVerses(
  store: BibleVerseStore,
  verses: readonly BibleVerse[],
): Promise<number> {
  const held = new Set(store.getState().verses.map((verse) => verse.id))
  const fresh = verses.filter((verse) => !held.has(verse.id))
  await Promise.all(fresh.map((verse) => store.getState().save(verse)))
  return fresh.length
}
