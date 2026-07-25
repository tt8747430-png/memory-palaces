import { describe, expect, it } from 'vitest'
import { flattenDecks } from './tree-flatten'
import type { TreeDeck } from './deck-tree'

const deck = (id: string, parentId: string | null, extra: Partial<TreeDeck> = {}): TreeDeck => ({
  id,
  parentId,
  ...extra,
})

// A (root) → B → C ; A → D ; E (root). All unfiled.
const forest: TreeDeck[] = [
  deck('A', null, { order: 0 }),
  deck('D', 'A', { order: 1 }),
  deck('B', 'A', { order: 0 }),
  deck('C', 'B', { order: 0 }),
  deck('E', null, { order: 1 }),
]

describe('flattenDecks', () => {
  it('descends only into expanded decks', () => {
    const collapsed = flattenDecks(forest, new Set(), null)
    expect(collapsed.map((f) => f.id)).toEqual(['A', 'E'])
    expect(collapsed[0]).toMatchObject({ id: 'A', depth: 0, hasChildren: true, expanded: false })
  })

  it('expands children in order with increasing depth', () => {
    const open = flattenDecks(forest, new Set(['A', 'B']), null)
    expect(open.map((f) => [f.id, f.depth])).toEqual([
      ['A', 0],
      ['B', 1], // B has order 0, before D
      ['C', 2],
      ['D', 1],
      ['E', 0],
    ])
  })
})
