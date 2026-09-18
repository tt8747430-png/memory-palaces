/**
 * Removes a reference that a card back opens with. `40 days and 40 nights` keeps its
 * number: only `chapter:verse` shapes count, optionally bracketed and optionally
 * preceded by a book name (which may itself start with a number, as in `1 John`).
 */
const LEADING = /^\(?\s*(?:\d?\s*[\p{L}][\p{L}.\s]*?\s+)?(\d+):(\d+)\s*\)?[\s.:–-]*/u

export function stripReference(back: string): string {
  return back.replace(LEADING, '').trim()
}
