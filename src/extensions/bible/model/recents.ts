import type { BookCode } from './canon'
import { parseRef } from './reference'

export interface RecentPassage {
  book: BookCode
  chapter: number
}

const RECENT_LIMIT = 6

/**
 * The chapters the learner added verses from most recently, newest first. Derived from the cards
 * themselves rather than stored: nothing new to persist, and it follows the learner to every device
 * their cards sync to.
 */
export function recentPassages(
  cards: readonly { front: string; createdAt: string }[],
  limit = RECENT_LIMIT,
): RecentPassage[] {
  const newest = [...cards].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const seen = new Set<string>()
  const recent: RecentPassage[] = []
  for (const card of newest) {
    const ref = parseRef(card.front)
    if (!ref) continue
    const key = `${ref.book}:${ref.chapter}`
    if (seen.has(key)) continue
    seen.add(key)
    recent.push({ book: ref.book, chapter: ref.chapter })
    if (recent.length === limit) break
  }
  return recent
}
