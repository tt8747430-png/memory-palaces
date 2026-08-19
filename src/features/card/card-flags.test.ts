import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { type Card, createCardStore, makeCard } from '@/entities/card'
import { resetCardsSrs, setCardFastReview, toggleCardFrozen, toggleCardReversed } from './index'

const card = (id: string, extra: Partial<Card> = {}): Card => ({
  ...makeCard({ id, createdAt: new Date(0).toISOString(), deckId: 'd1', front: id, back: 'b' }),
  ...extra,
})

function storeWith(...cards: Card[]) {
  return started(createCardStore(new InMemoryRepository<Card>(cards)))
}

describe('card flags', () => {
  it('freezes and unfreezes', async () => {
    const store = storeWith(card('c1'))
    expect((await toggleCardFrozen(store, 'c1')).frozen).toBe(true)
    expect((await toggleCardFrozen(store, 'c1')).frozen).toBe(false)
  })

  it('reverses and unreverses', async () => {
    const store = storeWith(card('c1'))
    expect((await toggleCardReversed(store, 'c1')).reversed).toBe(true)
    expect((await toggleCardReversed(store, 'c1')).reversed).toBe(false)
  })

  it('records a fast-review outcome', async () => {
    const store = storeWith(card('c1'))
    expect((await setCardFastReview(store, 'c1', 'notQuite')).fastReview).toBe('notQuite')
    expect((await setCardFastReview(store, 'c1', 'gotIt')).fastReview).toBe('gotIt')
  })

  it('resetting progress forgets the fast-review bucket too', async () => {
    const store = storeWith(card('c1', { fastReview: 'gotIt' }))
    await resetCardsSrs(store, ['c1'])
    const reset = store.getState().cards.find((each) => each.id === 'c1')
    expect(reset?.srs).toBeUndefined()
    expect(reset?.fastReview).toBeUndefined()
  })
})
