import { BOOKS, type BookCode, chapterCount, type Testament } from './canon'
import type { LibraryIndex } from './library-index'

export interface BookCoverage {
  book: BookCode
  testament: Testament
  chapters: number
  chaptersInBook: number
  verses: number
}

/** Every book with how much of it the Bible library holds, in canon order. */
export function libraryCoverage(index: LibraryIndex): BookCoverage[] {
  return BOOKS.map((book) => ({
    book: book.code,
    testament: book.testament,
    ...index.coverage(book.code),
    chaptersInBook: chapterCount(book.code),
  }))
}
