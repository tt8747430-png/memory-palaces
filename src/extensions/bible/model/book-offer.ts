/**
 * Whether the passage picker lets the learner pick a book. One the Bible library holds text for,
 * always: its passages fill themselves. One it holds none for is disabled — unless the Bible
 * library holds no text at all, when there is nothing to steer toward and pasting is the way in for every
 * passage (disabling all sixty-six would leave a picker with nothing to pick), or in dev mode, where
 * picking a book is how its text gets published.
 */
export function isBookPickable(
  book: string,
  booksWithText: ReadonlySet<string>,
  devMode: boolean,
): boolean {
  return booksWithText.has(book) || booksWithText.size === 0 || devMode
}
