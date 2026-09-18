/** `Genesis 1` — the name a chapter deck takes, whether the app places it or the learner is offered it. */
export function chapterDeckName(book: string, chapter: number): string {
  return `${book} ${chapter}`
}
