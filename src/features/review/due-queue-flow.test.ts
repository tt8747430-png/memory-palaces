import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createLocusStore, type Locus, makeLocus } from '@/entities/locus'
import { getDueLoci } from '@/shared/lib'
import { gradeCard } from './grade-card'

/**
 * Binds the write path (gradeCard → SRS schedule) to the read path (getDueLoci, the
 * real cross-library queue builder). gradeCard and getDueLoci are each unit-tested in
 * isolation; this asserts the contract that joins them — a card graded `again` reappears
 * in today's queue, a card graded `good` drops out — so a drift in either side is caught.
 */
const NOW = Date.UTC(2026, 0, 10)
const palaces = [{ id: 'p1', name: 'Palace' }]
const rooms = [{ id: 'r1', palaceId: 'p1', title: 'Room' }]

function card(id: string): Locus {
  return makeLocus({
    id,
    createdAt: new Date(0).toISOString(),
    roomId: 'r1',
    front: 'a',
    back: 'b',
  })
}

function storeWith(loci: Locus[]) {
  const store = createLocusStore(new InMemoryRepository<Locus>(loci))
  store.getState().start()
  return store
}

const dueIds = (store: ReturnType<typeof storeWith>) =>
  getDueLoci(palaces, rooms, store.getState().loci, NOW).map((due) => due.locus.id)

describe('grade → due-queue flow', () => {
  it('a brand-new card is in today’s queue', () => {
    const store = storeWith([card('l1')])
    expect(dueIds(store)).toContain('l1')
  })

  it("a card graded 'again' stays in today's queue", async () => {
    const store = storeWith([card('l1')])
    await gradeCard(store, 'l1', 'again', NOW)
    expect(dueIds(store)).toContain('l1')
  })

  it("a card graded 'good' leaves today's queue", async () => {
    const store = storeWith([card('l1')])
    await gradeCard(store, 'l1', 'good', NOW)
    expect(dueIds(store)).not.toContain('l1')
  })
})
