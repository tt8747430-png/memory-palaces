import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createDeckStore, type Deck, makeDeck } from '@/entities/deck'
import {
  createPreferencesStore,
  makePreferences,
  type Preferences,
  selectSubdeckSorts,
} from '@/entities/preferences'
import { started } from '@/shared/test/started'
import { keepSubdeckOrdersOwned } from './keep-subdeck-orders-owned'

const at = (ms: number) => new Date(ms).toISOString()

const deck = (id: string) => makeDeck({ id, createdAt: at(0), name: id })

const prefs = (subdeckSorts: Record<string, string>): Preferences => ({
  ...makePreferences({ id: 'preferences', createdAt: at(0) }),
  subdeckSorts,
})

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const stores = (decks: Deck[], subdeckSorts: Record<string, string>) => ({
  deckStore: started(createDeckStore(new InMemoryRepository<Deck>(decks))),
  preferencesStore: started(
    createPreferencesStore(new InMemoryRepository<Preferences>([prefs(subdeckSorts)])),
  ),
})

describe('keepSubdeckOrdersOwned', () => {
  it('forgets the order chosen for a deck that is no longer there', async () => {
    const { deckStore, preferencesStore } = stores([deck('d1')], { d1: 'name', gone: 'recent' })

    const stop = keepSubdeckOrdersOwned({ deckStore, preferencesStore })
    await flush()

    expect(selectSubdeckSorts(preferencesStore.getState())).toEqual({ d1: 'name' })
    stop()
  })

  it('forgets one the moment its deck is deleted', async () => {
    const { deckStore, preferencesStore } = stores([deck('d1'), deck('d2')], {
      d1: 'name',
      d2: 'recent',
    })
    const stop = keepSubdeckOrdersOwned({ deckStore, preferencesStore })
    await flush()
    expect(selectSubdeckSorts(preferencesStore.getState())).toEqual({ d1: 'name', d2: 'recent' })

    await deckStore.getState().remove('d2')
    await flush()

    expect(selectSubdeckSorts(preferencesStore.getState())).toEqual({ d1: 'name' })
    stop()
  })

  it('keeps an order whose deck is archived — the deck is a place away, not gone', async () => {
    const { deckStore, preferencesStore } = stores([{ ...deck('d1'), archived: true }], {
      d1: 'name',
    })

    const stop = keepSubdeckOrdersOwned({ deckStore, preferencesStore })
    await flush()

    expect(selectSubdeckSorts(preferencesStore.getState())).toEqual({ d1: 'name' })
    stop()
  })

  it('writes nothing before both stores have mirrored — empty is not "no decks"', async () => {
    const deckStore = createDeckStore(new InMemoryRepository<Deck>([deck('d1')]))
    const preferencesStore = started(
      createPreferencesStore(new InMemoryRepository<Preferences>([prefs({ gone: 'name' })])),
    )

    const stop = keepSubdeckOrdersOwned({ deckStore, preferencesStore })
    await flush()

    expect(selectSubdeckSorts(preferencesStore.getState())).toEqual({ gone: 'name' })
    stop()
  })

  it('writes nothing when every order has its deck', async () => {
    const { deckStore, preferencesStore } = stores([deck('d1')], { d1: 'name' })
    const before = preferencesStore.getState().preferences?.updatedAt

    const stop = keepSubdeckOrdersOwned({ deckStore, preferencesStore })
    await flush()

    expect(preferencesStore.getState().preferences?.updatedAt).toBe(before)
    stop()
  })
})
