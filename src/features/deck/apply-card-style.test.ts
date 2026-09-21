import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import {
  type CardStyle,
  createDeckStore,
  type Deck,
  DEFAULT_CARD_STYLE,
  makeDeck,
  resolveDeckSettings,
  selectDecks,
} from '@/entities/deck'
import { applyCardStyle } from './apply-card-style'

const CREATED = new Date(0).toISOString()

const PARCHMENT: CardStyle = {
  preset: 'parchment',
  font: 'serif',
  textSize: 34,
  alignment: 'left',
}

/**
 * Grammar carries Verbs and Irregular beneath it; Science stands on its own; Shelved is archived.
 */
function libraryStore() {
  const decks: Deck[] = [
    makeDeck({ id: 'grammar', createdAt: CREATED, name: 'Grammar' }),
    makeDeck({ id: 'verbs', createdAt: CREATED, name: 'Verbs', parentId: 'grammar' }),
    makeDeck({ id: 'irregular', createdAt: CREATED, name: 'Irregular', parentId: 'verbs' }),
    makeDeck({ id: 'science', createdAt: CREATED, name: 'Science' }),
    { ...makeDeck({ id: 'shelved', createdAt: CREATED, name: 'Shelved' }), archived: true },
  ]
  return started(createDeckStore(new InMemoryRepository<Deck>(decks)))
}

const stored = (store: ReturnType<typeof libraryStore>, id: string) =>
  selectDecks(store.getState()).find((deck) => deck.id === id)?.settings.cardStyle

const shown = (store: ReturnType<typeof libraryStore>, id: string) =>
  resolveDeckSettings(selectDecks(store.getState()), id).cardStyle

describe('applyCardStyle', () => {
  it('gives the style to one deck, and leaves its peers alone', async () => {
    const store = libraryStore()
    const changed = await applyCardStyle(store, PARCHMENT, { kind: 'deck', deckId: 'science' })

    expect(changed).toBe(1)
    expect(stored(store, 'science')).toEqual(PARCHMENT)
    expect(stored(store, 'grammar')).toBeUndefined()
  })

  it('reaches a whole subtree, root included', async () => {
    const store = libraryStore()
    await applyCardStyle(store, PARCHMENT, { kind: 'subtree', deckId: 'grammar' })

    for (const id of ['grammar', 'verbs', 'irregular']) {
      expect(shown(store, id)).toEqual(PARCHMENT)
    }
    expect(shown(store, 'science')).toEqual(DEFAULT_CARD_STYLE)
  })

  it('gives every deck in the subtree a style of its own, not one it borrows', async () => {
    const store = libraryStore()
    const changed = await applyCardStyle(store, PARCHMENT, { kind: 'subtree', deckId: 'grammar' })

    expect(changed).toBe(3)
    for (const id of ['grammar', 'verbs', 'irregular']) {
      expect(stored(store, id)).toEqual(PARCHMENT)
    }
  })

  it('overrules a subdeck that had a style of its own', async () => {
    const store = libraryStore()
    const other: CardStyle = { ...DEFAULT_CARD_STYLE, preset: 'chalk' }
    await applyCardStyle(store, other, { kind: 'deck', deckId: 'verbs' })

    await applyCardStyle(store, PARCHMENT, { kind: 'subtree', deckId: 'grammar' })
    expect(stored(store, 'verbs')).toEqual(PARCHMENT)
  })

  it('reaches every deck in the library but not the archived ones', async () => {
    const store = libraryStore()
    await applyCardStyle(store, PARCHMENT, { kind: 'all' })

    expect(shown(store, 'grammar')).toEqual(PARCHMENT)
    expect(shown(store, 'science')).toEqual(PARCHMENT)
    expect(stored(store, 'shelved')).toBeUndefined()
  })

  it('counts nothing when every deck already shows the style', async () => {
    const store = libraryStore()
    await applyCardStyle(store, PARCHMENT, { kind: 'all' })
    expect(await applyCardStyle(store, PARCHMENT, { kind: 'all' })).toBe(0)
  })

  it('takes a hand-picked set, ignoring an id the library does not hold', async () => {
    const store = libraryStore()
    const changed = await applyCardStyle(store, PARCHMENT, {
      kind: 'ids',
      ids: ['science', 'science', 'gone'],
    })

    expect(changed).toBe(1)
    expect(stored(store, 'science')).toEqual(PARCHMENT)
  })
})
