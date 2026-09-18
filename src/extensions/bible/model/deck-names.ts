import type { BookCode } from './canon'
import { bookName } from './book-names'

/** `1 Corinteni 8` — the name a chapter deck takes, whether the app places it or the learner is offered it. */
export function chapterDeckName(book: BookCode, chapter: number): string {
  return `${bookName(book)} ${chapter}`
}
