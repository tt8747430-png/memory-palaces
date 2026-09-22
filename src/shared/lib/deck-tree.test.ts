import { describe, expect, it } from 'vitest'
import {
  canReparent,
  cardsInSubtree,
  childDecks,
  deckPath,
  dueCountsPerDeck,
  idsWithoutDescendants,
  inheritSettings,
  isDescendantOrSelf,
  orderSiblings,
  reachableDecks,
  subtreeDeckIds,
  subtreeDecks,
  type TreeCard,
  type TreeDeck,
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

describe('reachableDecks', () => {
  const place = (decks: readonly TreeDeck[], id: string) => {
    const found = decks.find((d) => d.id === id)
    return found ? { parentId: found.parentId, folderId: found.folderId ?? null } : undefined
  }

  it('hands back every deck that already stands somewhere, as the same object', () => {
    const reached = reachableDecks(forest, new Set(['f1']))
    reached.forEach((each, at) => expect(each).toBe(forest[at]))
  })

  it('stands a deck whose folder is gone at the top of the Library', () => {
    // The learner's `1 Corinteni`: filed into a folder another device deleted, seeing it empty.
    const reached = reachableDecks(forest, new Set())
    expect(place(reached, 'A')).toEqual({ parentId: null, folderId: null })
    // Its subdecks travel with it, still under it.
    expect(place(reached, 'B')).toEqual({ parentId: 'A', folderId: null })
  })

  it('files a deck into its folder as soon as the folder arrives', () => {
    // A pull can land the deck before its folder: nothing is written in between.
    expect(place(reachableDecks(forest, new Set()), 'A')?.folderId).toBeNull()
    expect(place(reachableDecks(forest, new Set(['f1'])), 'A')?.folderId).toBe('f1')
  })

  it('lifts a subdeck whose parent is gone or archived', () => {
    const decks = [
      deck('gone-child', 'missing'),
      deck('P', null, { archived: true }),
      deck('live-child', 'P'),
    ]
    const reached = reachableDecks(decks, new Set())
    expect(place(reached, 'gone-child')).toEqual({ parentId: null, folderId: null })
    expect(place(reached, 'live-child')).toEqual({ parentId: null, folderId: null })
  })

  it('breaks a loop of parents rather than walking it forever', () => {
    const reached = reachableDecks([deck('X', 'Y'), deck('Y', 'X')], new Set())
    expect(reached.map((d) => d.parentId)).toEqual([null, null])
  })

  it('leaves the Archive alone — archived decks have a place of their own', () => {
    const archived = deck('R', 'missing', { archived: true })
    expect(reachableDecks([archived], new Set())[0]).toBe(archived)
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

describe('idsWithoutDescendants', () => {
  it('drops every deck whose ancestor is in the batch, keeping the batch order', () => {
    expect(idsWithoutDescendants(forest, ['C', 'A', 'D', 'B', 'E'])).toEqual(['A', 'E'])
  })

  it('keeps a subdeck whose parent is not in the batch', () => {
    expect(idsWithoutDescendants(forest, ['C', 'D'])).toEqual(['C', 'D'])
  })

  it('reaches past a gap in the batch to a further ancestor', () => {
    expect(idsWithoutDescendants(forest, ['A', 'C'])).toEqual(['A'])
  })

  it('is cycle-safe if data is corrupt', () => {
    const cyclic: TreeDeck[] = [deck('X', 'Y'), deck('Y', 'X')]
    expect(idsWithoutDescendants(cyclic, ['X'])).toEqual(['X'])
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

describe('inheritSettings', () => {
  const decks = [
    { id: 'A', parentId: null, settings: { tts: true } as Partial<Settings> },
    { id: 'B', parentId: 'A', settings: {} as Partial<Settings> },
    { id: 'C', parentId: 'B', settings: { shuffle: true } as Partial<Settings> },
  ]
  it('inherits from ancestors and applies base for unset fields', () => {
    expect(inheritSettings(decks, 'B', base)).toEqual({
      algo: 'sm2',
      tts: true,
      shuffle: false,
    })
  })
  it('lets a deeper deck override while still inheriting the rest', () => {
    expect(inheritSettings(decks, 'C', base)).toEqual({ algo: 'sm2', tts: true, shuffle: true })
  })
  it('a nearer override wins over an ancestor override', () => {
    const over = [
      { id: 'A', parentId: null, settings: { tts: true } as Partial<Settings> },
      { id: 'B', parentId: 'A', settings: { tts: false } as Partial<Settings> },
    ]
    expect(inheritSettings(over, 'B', base).tts).toBe(false)
  })
  it('reads a main-deck-only key from the top of the tree, whatever a subdeck holds', () => {
    const over = [
      { id: 'A', parentId: null, settings: { algo: 'fsrs' } as Partial<Settings> },
      { id: 'B', parentId: 'A', settings: { algo: 'sm2', tts: true } as Partial<Settings> },
      { id: 'C', parentId: 'B', settings: { algo: 'leitner' } as Partial<Settings> },
    ]
    expect(inheritSettings(over, 'C', base, ['algo'])).toEqual({
      algo: 'fsrs',
      tts: true,
      shuffle: false,
    })
  })
  it('falls back to the base when the main deck never set a main-deck-only key', () => {
    const over = [
      { id: 'A', parentId: null, settings: {} as Partial<Settings> },
      { id: 'B', parentId: 'A', settings: { algo: 'fsrs' } as Partial<Settings> },
    ]
    expect(inheritSettings(over, 'B', base, ['algo']).algo).toBe('sm2')
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

describe('cardsInSubtree', () => {
  const cards: TreeCard[] = [{ deckId: 'A' }, { deckId: 'B' }, due, notDue, { deckId: 'E' }]
  it('gathers cards attached anywhere in the subtree', () => {
    expect(cardsInSubtree(forest, cards, 'A')).toHaveLength(4)
    expect(cardsInSubtree(forest, cards, 'E')).toHaveLength(1)
  })
})

describe('dueCountsPerDeck', () => {
  it('rolls a due card up to every ancestor', () => {
    const cards: TreeCard[] = [due]
    const counts = dueCountsPerDeck(forest, cards, Date.now(), () => 'spaced')
    expect(counts.get('C')).toBe(1)
    expect(counts.get('B')).toBe(1)
    expect(counts.get('A')).toBe(1)
    expect(counts.get('D')).toBeUndefined()
    expect(counts.get('E')).toBeUndefined()
  })
  it('counts a fast deck by what is left to get right, as that deck reports itself', () => {
    // The deck page counts a Fast deck's not-yet-got-right cards; a badge counting due dates
    // instead would contradict the page the learner opens from it.
    const cards: TreeCard[] = [
      { deckId: 'C', fastReview: 'gotIt' },
      { deckId: 'C', fastReview: 'notQuite' },
      { deckId: 'C' },
    ]
    const counts = dueCountsPerDeck(forest, cards, Date.now(), () => 'fast')
    expect(counts.get('C')).toBe(2)
    expect(counts.get('A')).toBe(2)
  })

  it('counts nothing for a fast deck whose every card has been got right', () => {
    const cards: TreeCard[] = [{ deckId: 'C', fastReview: 'gotIt' }]
    expect(dueCountsPerDeck(forest, cards, Date.now(), () => 'fast').get('C')).toBeUndefined()
  })

  it('skips cards under an archived deck or archived ancestor', () => {
    const archivedForest: TreeDeck[] = [deck('A', null, { archived: true }), deck('B', 'A')]
    const counts = dueCountsPerDeck(archivedForest, [{ deckId: 'B' }], Date.now(), () => 'spaced')
    expect(counts.size).toBe(0)
  })
})

describe('orderSiblings', () => {
  const filed: TreeDeck[] = [
    deck('A', null, { folderId: 'f1', order: 0 }),
    deck('B', null, { folderId: 'f1', order: 1, archived: true }),
    deck('C', null, { folderId: null, order: 0 }),
    deck('D', 'A', { order: 0 }),
  ]

  it('gathers the decks filed under the same folder at the root', () => {
    expect(orderSiblings(filed, null, 'f1').map((d) => d.id)).toEqual(['A', 'B'])
  })

  it('ignores the folder once there is a parent deck', () => {
    expect(orderSiblings(filed, 'A').map((d) => d.id)).toEqual(['D'])
  })

  it('keeps archived siblings, because they still hold an order', () => {
    expect(orderSiblings(filed, null, 'f1').some((d) => d.archived)).toBe(true)
  })

  it('leaves the moving decks out of their own reckoning', () => {
    expect(orderSiblings(filed, null, 'f1', new Set(['A'])).map((d) => d.id)).toEqual(['B'])
  })
})
