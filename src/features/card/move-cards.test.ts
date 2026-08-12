import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { type Card, createCardStore } from '@/entities/card'
import { createCard } from './create-card'
import { moveCards, restoreCardPlacements } from './move-cards'

const NOW = Date.UTC(2026, 0, 10)
const LATER = Date.UTC(2026, 0, 11)

function startedStore() {
  const store = createCardStore(new InMemoryRepository<Card>())
  store.getState().start()
  return store
}

const cardById = (store: ReturnType<typeof startedStore>, id: string) =>
  store.getState().cards.find((card) => card.id === id)

describe('moveCards', () => {
  it('lands moved cards after the target deck’s last card, in the order given', async () => {
    const store = startedStore()
    const a = await createCard(store, 'source', { front: 'a', back: '1' }, NOW)
    const b = await createCard(store, 'source', { front: 'b', back: '2' }, NOW)
    const resident = await createCard(store, 'target', { front: 'r', back: '0' }, NOW)

    await moveCards(store, [b.id, a.id], 'target', LATER)

    expect(cardById(store, resident.id)?.order).toBe(0)
    expect(cardById(store, b.id)).toMatchObject({ deckId: 'target', order: 1 })
    expect(cardById(store, a.id)).toMatchObject({ deckId: 'target', order: 2 })
  })

  it('returns where each card was, so the move can be undone', async () => {
    const store = startedStore()
    const card = await createCard(store, 'source', { front: 'a', back: '1' }, NOW)

    const previous = await moveCards(store, [card.id], 'target', LATER)
    expect(previous).toEqual([{ id: card.id, deckId: 'source', order: 0 }])

    await restoreCardPlacements(store, previous, LATER)
    expect(cardById(store, card.id)).toMatchObject({ deckId: 'source', order: 0 })
  })

  it('leaves cards already in the target deck alone', async () => {
    const store = startedStore()
    const card = await createCard(store, 'target', { front: 'a', back: '1' }, NOW)

    expect(await moveCards(store, [card.id], 'target', LATER)).toEqual([])
    expect(cardById(store, card.id)?.updatedAt).toBe(card.updatedAt)
  })

  it('skips ids the store no longer holds rather than throwing', async () => {
    const store = startedStore()
    const card = await createCard(store, 'source', { front: 'a', back: '1' }, NOW)

    const previous = await moveCards(store, ['gone', card.id], 'target', LATER)

    expect(previous).toHaveLength(1)
    expect(cardById(store, card.id)?.deckId).toBe('target')
  })

  it('stamps updatedAt from the injected clock', async () => {
    const store = startedStore()
    const card = await createCard(store, 'source', { front: 'a', back: '1' }, NOW)

    await moveCards(store, [card.id], 'target', LATER)

    expect(cardById(store, card.id)?.updatedAt).toBe(new Date(LATER).toISOString())
  })

  it('skips a card deleted since the move when putting cards back', async () => {
    const store = startedStore()
    const card = await createCard(store, 'source', { front: 'a', back: '1' }, NOW)
    const previous = await moveCards(store, [card.id], 'target', LATER)
    await store.getState().remove(card.id)

    await expect(restoreCardPlacements(store, previous, LATER)).resolves.toBeUndefined()
    expect(store.getState().cards).toHaveLength(0)
  })
})
