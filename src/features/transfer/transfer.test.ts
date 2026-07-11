import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createCardStore, type Card, makeCard } from '@/entities/card'
import { jsonStrategy } from './json-strategy'
import { csvStrategy } from './csv-strategy'
import { exportCards } from './export-content'
import { importCards } from './import-content'

const card = (front: string, back: string, hint?: string) => ({ front, back, hint })

describe('jsonStrategy', () => {
  it('round-trips full card fields', () => {
    const cards = [card('Mihi', 'to me', 'a hand')]
    expect(jsonStrategy.parse(jsonStrategy.serialize(cards))).toEqual(cards)
  })

  it('throws on malformed JSON', () => {
    expect(() => jsonStrategy.parse('not json')).toThrow()
  })

  it('rejects JSON that is not an array of cards', () => {
    expect(() => jsonStrategy.parse('{"front":"x"}')).toThrow()
  })
})

describe('csvStrategy', () => {
  it('round-trips front/back, quoting fields with commas, quotes, and newlines', () => {
    const cards = [
      { front: 'plain', back: 'simple' },
      { front: 'has, comma', back: 'has "quote"' },
      { front: 'line\nbreak', back: 'ok' },
    ]
    expect(csvStrategy.parse(csvStrategy.serialize(cards))).toEqual(cards)
  })

  it('ignores trailing blank lines', () => {
    expect(csvStrategy.parse('a,b\n')).toEqual([{ front: 'a', back: 'b' }])
  })
})

describe('exportCards', () => {
  it('serializes a room’s loci as portable cards', () => {
    const loci: Card[] = [
      makeCard({
        id: 'l1',
        createdAt: new Date(0).toISOString(),
        deckId: 'd1',
        front: 'A',
        back: 'B',
      }),
    ]
    const text = exportCards(loci, jsonStrategy)
    expect(jsonStrategy.parse(text)).toEqual([
      { front: 'A', back: 'B', hint: undefined, tip: undefined },
    ])
  })
})

describe('importCards', () => {
  it('creates a locus per parsed card, scoped to the room and persisted', async () => {
    const repo = new InMemoryRepository<Card>()
    const store = createCardStore(repo)
    store.getState().start()

    const created = await importCards(store, 'd1', 'Mihi,to me\nTibi,to you', csvStrategy)

    expect(created).toHaveLength(2)
    expect(store.getState().cards.map((l) => [l.front, l.back, l.deckId])).toEqual([
      ['Mihi', 'to me', 'd1'],
      ['Tibi', 'to you', 'd1'],
    ])
    expect(await repo.getAll()).toHaveLength(2)
  })
})
