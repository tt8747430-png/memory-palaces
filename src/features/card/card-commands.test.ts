import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { type Card, createCardStore } from '@/entities/card'
import { createCard } from './create-card'
import { editCard } from './card-commands'

const NOW = Date.UTC(2026, 0, 10)

function startedStore() {
  const store = createCardStore(new InMemoryRepository<Card>())
  store.getState().start()
  return store
}

describe('editCard', () => {
  it('clears an optional the draft dropped, rather than keeping the old value', async () => {
    const store = startedStore()
    const card = await createCard(
      store,
      'd1',
      { front: 'bonjour', back: 'hello', hint: 'greeting', tip: 'informal' },
      NOW,
    )
    expect(card.hint).toBe('greeting')

    const edited = await editCard(
      store,
      card.id,
      { front: 'bonjour', back: 'hello', hint: undefined, tip: undefined },
      NOW,
    )

    expect(edited.hint).toBeUndefined()
    expect(edited.tip).toBeUndefined()
    expect(store.getState().cards[0]?.hint).toBeUndefined()
  })

  it('stamps updatedAt from the injected clock', async () => {
    const store = startedStore()
    const card = await createCard(store, 'd1', { front: 'a', back: 'b' }, NOW)
    const edited = await editCard(store, card.id, { front: 'c' }, NOW + 1000)
    expect(edited.updatedAt).toBe(new Date(NOW + 1000).toISOString())
  })

  it('throws on a stale id', async () => {
    const store = startedStore()
    await expect(editCard(store, 'gone', { front: 'x' })).rejects.toThrow('Card not found: gone')
  })
})
