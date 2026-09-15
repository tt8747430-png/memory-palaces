import { describe, expect, it } from 'vitest'
import { classifyChange, descendantsOf, parentIdsOf } from './sync-divergence'

const live = { deleted: false }
const gone = { deleted: true }

describe('classifyChange', () => {
  it('pulls cleanly what the device has no opinion on', () => {
    expect(classifyChange(undefined, live)).toBe('clean')
    expect(classifyChange(undefined, gone)).toBe('clean')
  })

  it('merges an edit made on both sides', () => {
    expect(classifyChange({ op: 'save' }, live)).toBe('mergeable')
  })

  it('asks about a deletion here that the cloud went on editing', () => {
    expect(classifyChange({ op: 'remove' }, live)).toBe('destructive')
  })

  it('asks nothing when both sides deleted it', () => {
    expect(classifyChange({ op: 'remove' }, gone)).toBe('clean')
  })
})

describe('parentIdsOf', () => {
  it('reads every parent a document can name, and ignores empty ones', () => {
    expect(parentIdsOf({ deckId: 'd1' })).toEqual(['d1'])
    expect(parentIdsOf({ parentId: 'd1', folderId: 'f1' })).toEqual(['d1', 'f1'])
    expect(parentIdsOf({ parentId: null, folderId: '' })).toEqual([])
  })
})

describe('descendantsOf', () => {
  it('finds children at any depth, each under the root it belongs to', () => {
    const found = descendantsOf(
      ['f1', 'd9'],
      [
        { id: 'c1', deckId: 'sub' },
        { id: 'sub', parentId: 'd1' },
        { id: 'd1', folderId: 'f1' },
        { id: 'q1', deckId: 'd9' },
        { id: 'stranger', deckId: 'elsewhere' },
      ],
    )

    expect(Object.fromEntries(found)).toEqual({ d1: 'f1', sub: 'f1', c1: 'f1', q1: 'd9' })
  })

  it('finds nothing with no roots', () => {
    expect(descendantsOf([], [{ id: 'c1', deckId: 'd1' }]).size).toBe(0)
  })
})
