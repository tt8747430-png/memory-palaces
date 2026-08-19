import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { createDeckStore, type Deck, makeDeck } from '@/entities/deck'
import { updateDeckSettings } from './update-deck-settings'

function storeWith(settings: Deck['settings'] = {}) {
  const deck = makeDeck({
    id: 'd1',
    createdAt: new Date(0).toISOString(),
    name: 'Physics',
    settings,
  })
  return started(createDeckStore(new InMemoryRepository<Deck>([deck])))
}

describe('updateDeckSettings', () => {
  it('merges the patch over the deck’s existing overrides', async () => {
    const store = storeWith({ algorithm: 'fast', newCardsPerDay: 25 })
    const next = await updateDeckSettings(store, 'd1', { newCardsPerDay: 40 })
    expect(next.settings).toEqual({ algorithm: 'fast', newCardsPerDay: 40 })
  })

  it('leaves untouched settings alone', async () => {
    const store = storeWith({ shuffleCards: true })
    const next = await updateDeckSettings(store, 'd1', { algorithm: 'fast' })
    expect(next.settings.shuffleCards).toBe(true)
  })

  it('throws for a deck that is not there', async () => {
    await expect(updateDeckSettings(storeWith(), 'nope', {})).rejects.toThrow('Deck not found: nope')
  })

  it('refuses an invalid patch', async () => {
    await expect(updateDeckSettings(storeWith(), 'd1', { newCardsPerDay: -1 })).rejects.toThrow(
      'New cards per day must be >= 0',
    )
  })
})
