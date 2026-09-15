import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { createDeckStore, type Deck } from '@/entities/deck'
import { completeDeck, makeDeck } from './types'

const NOW = new Date(0).toISOString()
const PUBLIC = 'https://abc.supabase.co/storage/v1/object/public/deck-images/u1/d1'

const deckWith = (image?: string): Deck =>
  ({ ...makeDeck({ id: 'd1', createdAt: NOW, name: 'Kanji' }), image }) as Deck

describe('completeDeck', () => {
  it('narrows a cover that arrived as a public URL', () => {
    expect(completeDeck(deckWith(PUBLIC)).image).toBe('u1/d1')
  })

  it('hands back the same object when there is nothing to repair', () => {
    const deck = deckWith('u1/d1')
    expect(completeDeck(deck)).toBe(deck)
  })

  it('runs on the read path, with no migration in sight', async () => {
    // This is the case a schema migration cannot reach: replication writes a pulled row straight
    // into the collection, so a device still on deck v3 delivers a full public URL.
    const store = started(createDeckStore(new InMemoryRepository<Deck>([deckWith(PUBLIC)])))

    expect(store.getState().decks[0]?.image).toBe('u1/d1')
  })
})
