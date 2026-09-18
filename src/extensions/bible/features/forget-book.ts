import type { BookCode } from '../model/canon'
import type { BibleVerseStore } from '../model/store'

/**
 * Drops every verse of one book from the Bible library. A write, so it is a command and not
 * something a screen reaches into the store to do — the settings page calls this, in dev mode.
 */
export async function forgetBook(store: BibleVerseStore, book: BookCode): Promise<number> {
  const doomed = store.getState().verses.filter((verse) => verse.book === book)
  await Promise.all(doomed.map((verse) => store.getState().remove(verse.id)))
  return doomed.length
}
