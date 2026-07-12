import { describe, it, expect } from 'vitest'
import {
  childDecks,
  rootDecks,
  decksInFolder,
  subtreeDeckIds,
  subtreeDecks,
  deckPath,
  isDescendantOrSelf,
  canReparent,
  resolveDeckSettings,
  cardsInSubtree,
  countDueInSubtree,
  dueCountsPerDeck,
  type TreeDeck,
  type TreeCard,
} from './deck-tree'

const deck = (id: string, parentId: string | null, extra: Partial<TreeDeck> = {}): TreeDeck => ({
  id,
  parentId,
  ...extra,
})

const forest: TreeDeck[] = [
  deck('A', null, { folderId: 'f1', order: 1 }),
  deck('B', 'A', { order: 1 }),
  deck('C', 'B'),
  deck('D', 'A', { order: 0 }),
  deck('E', null, { order: 0 }),
]

describe('childDecks', () => {
  it('returns direct subdecks ordered by order then id', () => {
    expect(childDecks(forest, 'A').map((d) => d.id)).toEqual(['D', 'B'])
    expect(childDecks(forest, 'B').map((d) => d.id)).toEqual(['C'])
    expect(childDecks(forest, 'C')).toEqual([])
  })
})

describe('rootDecks / decksInFolder', () => {
  it('rootDecks are top-level and unfiled', () => {
    expect(rootDecks(forest).map((d) => d.id)).toEqual(['E'])
  })
  it('decksInFolder are top-level decks with that folderId', () => {
    expect(decksInFolder(forest, 'f1').map((d) => d.id)).toEqual(['A'])
    expect(decksInFolder(forest, 'nope')).toEqual([])
  })
})

describe('subtreeDeckIds / subtreeDecks', () => {
  it('lists a deck and all descendants, root first', () => {
    expect(subtreeDeckIds(forest, 'A')).toEqual(['A', 'D', 'B', 'C'])
    expect(subtreeDeckIds(forest, 'B')).toEqual(['B', 'C'])
    expect(subtreeDeckIds(forest, 'E')).toEqual(['E'])
  })
  it('subtreeDecks returns the node objects', () => {
    expect(subtreeDecks(forest, 'B').map((d) => d.id)).toEqual(['B', 'C'])
  })
  it('is cycle-safe if data is corrupt', () => {
    const cyclic: TreeDeck[] = [deck('X', 'Y'), deck('Y', 'X')]
    expect(subtreeDeckIds(cyclic, 'X')).toEqual(['X', 'Y'])
  })
})

describe('deckPath', () => {
  it('returns breadcrumbs from root ancestor to the node', () => {
    expect(deckPath(forest, 'C').map((d) => d.id)).toEqual(['A', 'B', 'C'])
    expect(deckPath(forest, 'A').map((d) => d.id)).toEqual(['A'])
  })
})

describe('isDescendantOrSelf / canReparent', () => {
  it('detects descendants and self', () => {
    expect(isDescendantOrSelf(forest, 'A', 'C')).toBe(true)
    expect(isDescendantOrSelf(forest, 'A', 'A')).toBe(true)
    expect(isDescendantOrSelf(forest, 'B', 'D')).toBe(false)
  })
  it('blocks re-parenting a deck under itself or a descendant', () => {
    expect(canReparent(forest, 'A', 'C')).toBe(false)
    expect(canReparent(forest, 'A', 'A')).toBe(false)
    expect(canReparent(forest, 'A', null)).toBe(true)
    expect(canReparent(forest, 'D', 'B')).toBe(true)
  })
})

interface Settings {
  algo: string
  tts: boolean
  shuffle: boolean
}
const base: Settings = { algo: 'sm2', tts: false, shuffle: false }

describe('resolveDeckSettings', () => {
  const decks = [
    { id: 'A', parentId: null, settings: { tts: true } as Partial<Settings> },
    { id: 'B', parentId: 'A', settings: {} as Partial<Settings> },
    { id: 'C', parentId: 'B', settings: { shuffle: true } as Partial<Settings> },
  ]
  it('inherits from ancestors and applies base for unset fields', () => {
    expect(resolveDeckSettings(decks, 'B', base)).toEqual({
      algo: 'sm2',
      tts: true,
      shuffle: false,
    })
  })
  it('lets a deeper deck override while still inheriting the rest', () => {
    expect(resolveDeckSettings(decks, 'C', base)).toEqual({ algo: 'sm2', tts: true, shuffle: true })
  })
  it('a nearer override wins over an ancestor override', () => {
    const over = [
      { id: 'A', parentId: null, settings: { tts: true } as Partial<Settings> },
      { id: 'B', parentId: 'A', settings: { tts: false } as Partial<Settings> },
    ]
    expect(resolveDeckSettings(over, 'B', base).tts).toBe(false)
  })
})

const due: TreeCard = { deckId: 'C' }
const notDue: TreeCard = {
  deckId: 'C',
  srs: {
    due: new Date(2999, 0, 1).toISOString(),
    interval: 30,
    ease: 2.5,
    reps: 5,
    lapses: 0,
    lastReviewed: new Date(0).toISOString(),
  },
}

describe('cardsInSubtree / countDueInSubtree', () => {
  const cards: TreeCard[] = [{ deckId: 'A' }, { deckId: 'B' }, due, notDue, { deckId: 'E' }]
  it('gathers cards attached anywhere in the subtree', () => {
    expect(cardsInSubtree(forest, cards, 'A')).toHaveLength(4)
    expect(cardsInSubtree(forest, cards, 'E')).toHaveLength(1)
  })
  it('counts only due cards in the subtree', () => {
    expect(countDueInSubtree(forest, cards, 'A', Date.now())).toBe(3)
  })
})

describe('dueCountsPerDeck', () => {
  it('rolls a due card up to every ancestor', () => {
    const cards: TreeCard[] = [due]
    const counts = dueCountsPerDeck(forest, cards, Date.now())
    expect(counts.get('C')).toBe(1)
    expect(counts.get('B')).toBe(1)
    expect(counts.get('A')).toBe(1)
    expect(counts.get('D')).toBeUndefined()
    expect(counts.get('E')).toBeUndefined()
  })
  it('skips cards under an archived deck or archived ancestor', () => {
    const archivedForest: TreeDeck[] = [deck('A', null, { archived: true }), deck('B', 'A')]
    const counts = dueCountsPerDeck(archivedForest, [{ deckId: 'B' }], Date.now())
    expect(counts.size).toBe(0)
  })
})
