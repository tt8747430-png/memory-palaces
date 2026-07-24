import { describe, expect, it } from 'vitest'
import {
  canReparent,
  cardsInSubtree,
  childDecks,
  countDueInSubtree,
  deckPath,
  deckSelectionStates,
  decksInFolder,
  selectionRoots,
  dueCountsPerDeck,
  isDescendantOrSelf,
  resolveDeckSettings,
  rootDecks,
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

describe('rootDecks / decksInFolder', () => {
  it('rootDecks are top-level and unfiled', () => {
    expect(rootDecks(forest).map((d) => d.id)).toEqual(['E'])
  })
  it('decksInFolder are top-level decks with that folderId', () => {
    expect(decksInFolder(forest, 'f1').map((d) => d.id)).toEqual(['A'])
    expect(decksInFolder(forest, 'nope')).toEqual([])
  })
})

describe('deckSelectionStates', () => {
  it('is all unchecked when nothing is selected', () => {
    const states = deckSelectionStates(forest, new Set())
    for (const id of ['A', 'B', 'C', 'D', 'E']) expect(states.get(id)).toBe('unchecked')
  })

  it('lights ancestors of a selected leaf as indeterminate', () => {
    const states = deckSelectionStates(forest, new Set(['C']))
    expect(states.get('C')).toBe('checked')
    expect(states.get('B')).toBe('indeterminate') // subtree {B,C}, only C
    expect(states.get('A')).toBe('indeterminate') // subtree {A,D,B,C}, only C
    expect(states.get('D')).toBe('unchecked')
    expect(states.get('E')).toBe('unchecked')
  })

  it('is checked when a deck and its whole subtree are selected', () => {
    const states = deckSelectionStates(forest, new Set(['A', 'D', 'B', 'C']))
    expect(states.get('A')).toBe('checked')
    expect(states.get('B')).toBe('checked')
    expect(states.get('C')).toBe('checked')
    expect(states.get('D')).toBe('checked')
    expect(states.get('E')).toBe('unchecked')
  })

  it('reads a deck selected without its subtree as indeterminate', () => {
    const states = deckSelectionStates(forest, new Set(['A']))
    expect(states.get('A')).toBe('indeterminate')
    expect(states.get('B')).toBe('unchecked')
  })

  it('ignores archived descendants so a parent can still read as checked', () => {
    const archivedForest: TreeDeck[] = [
      deck('A', null, { order: 0 }),
      deck('B', 'A', { order: 0 }),
      deck('C', 'B', { archived: true }),
    ]
    const states = deckSelectionStates(archivedForest, new Set(['B']))
    expect(states.get('B')).toBe('checked') // C is archived, excluded from the tally
    expect(states.get('A')).toBe('indeterminate') // active subtree {A,B}, only B
    expect(states.has('C')).toBe(false) // archived decks get no state
  })
})

describe('selectionRoots', () => {
  it('is empty when nothing is selected', () => {
    expect(selectionRoots(forest, new Set())).toEqual([])
  })

  it('drops a selected deck that already has a selected ancestor', () => {
    expect(selectionRoots(forest, new Set(['A', 'C']))).toEqual(['A'])
    expect(selectionRoots(forest, new Set(['B', 'C']))).toEqual(['B'])
  })

  it('keeps siblings and orders roots top-to-bottom', () => {
    // D (order 0) before B (order 1), both children of A but A itself unselected.
    expect(selectionRoots(forest, new Set(['D', 'B']))).toEqual(['D', 'B'])
    // Unfiled E is walked before the folder that holds A.
    expect(selectionRoots(forest, new Set(['A', 'E']))).toEqual(['E', 'A'])
  })

  it('ignores archived decks', () => {
    const archivedForest: TreeDeck[] = [
      deck('A', null, { order: 0 }),
      deck('B', 'A', { order: 0, archived: true }),
    ]
    expect(selectionRoots(archivedForest, new Set(['A', 'B']))).toEqual(['A'])
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
