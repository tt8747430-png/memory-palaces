import type { BibleVerseStore } from '../model/store'

/**
 * Drops every verse of one book from the on-device library. A write, so it is a command and not
 * something a screen reaches into the store to do — the admin screen calls this.
 */
export async function forgetBook(store: BibleVerseStore, book: string): Promise<number> {
  const doomed = store.getState().verses.filter((verse) => verse.book === book)
  for (const verse of doomed) await store.getState().remove(verse.id)
  return doomed.length
}
