import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@app/shared/data'
import { makeCard, CardStore } from '@app/decks'
import type { Card } from '@app/decks'
import { countDueInSubtree, type TreeDeck } from '@app/shared/domain'
import { gradeCard } from './grade-card'

const NOW = Date.UTC(2026, 0, 10)
const decks: TreeDeck[] = [{ id: 'd1', parentId: null }]

function card(id: string): Card {
  return makeCard({ id, createdAt: new Date(0).toISOString(), deckId: 'd1', front: 'a', back: 'b' })
}

function storeWith(cards: Card[]) {
  const store = new CardStore(new InMemoryRepository<Card>(cards))
  store.start()
  return store
}

const dueCount = (store: ReturnType<typeof storeWith>) =>
  countDueInSubtree(decks, store.cards(), 'd1', NOW)

describe('grade → due-queue flow', () => {
  it('a brand-new card is in today’s queue', () => {
    const store = storeWith([card('c1')])
    expect(dueCount(store)).toBe(1)
  })

  it("a card graded 'again' stays in today's queue", async () => {
    const store = storeWith([card('c1')])
    await gradeCard(store, 'c1', 'again', NOW)
    expect(dueCount(store)).toBe(1)
  })

  it("a card graded 'good' leaves today's queue", async () => {
    const store = storeWith([card('c1')])
    await gradeCard(store, 'c1', 'good', NOW)
    expect(dueCount(store)).toBe(0)
  })
})
