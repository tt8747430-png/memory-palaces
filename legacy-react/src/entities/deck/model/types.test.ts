import { describe, it, expect } from 'vitest'
import { makeDeck, updateDeck } from './types'

const base = { id: 'd1', createdAt: '2026-01-01T00:00:00.000Z', name: 'Bible' }

describe('makeDeck', () => {
  it('creates a top-level deck at the root by default', () => {
    const deck = makeDeck(base)
    expect(deck.parentId).toBeNull()
    expect(deck.folderId).toBeNull()
    expect(deck.order).toBe(0)
    expect(deck.settings).toEqual({})
  })

  it('files a top-level deck in a folder', () => {
    const deck = makeDeck({ ...base, folderId: 'f1' })
    expect(deck.folderId).toBe('f1')
    expect(deck.parentId).toBeNull()
  })

  it('a subdeck belongs to its parent, never a folder', () => {
    const deck = makeDeck({ ...base, parentId: 'p1', folderId: 'f1' })
    expect(deck.parentId).toBe('p1')
    expect(deck.folderId).toBeNull()
  })

  it('stores only setting overrides', () => {
    const deck = makeDeck({ ...base, settings: { textToSpeech: true } })
    expect(deck.settings).toEqual({ textToSpeech: true })
  })

  it('rejects a blank name and negative order', () => {
    expect(() => makeDeck({ ...base, name: '  ' })).toThrow()
    expect(() => makeDeck({ ...base, order: -1 })).toThrow()
  })
})

describe('updateDeck', () => {
  it('re-homing to root clears folderId only when it becomes top-level', () => {
    const sub = makeDeck({ ...base, parentId: 'p1' })
    const moved = updateDeck(sub, { parentId: null, folderId: 'f2' }, '2026-02-01T00:00:00.000Z')
    expect(moved.parentId).toBeNull()
    expect(moved.folderId).toBe('f2')
    expect(moved.updatedAt).toBe('2026-02-01T00:00:00.000Z')
  })

  it('making a deck a subdeck drops any folderId', () => {
    const top = makeDeck({ ...base, folderId: 'f1' })
    const nested = updateDeck(top, { parentId: 'p1' }, '2026-02-01T00:00:00.000Z')
    expect(nested.parentId).toBe('p1')
    expect(nested.folderId).toBeNull()
  })

  it('rejects a blank name', () => {
    const deck = makeDeck(base)
    expect(() => updateDeck(deck, { name: '' }, '2026-02-01T00:00:00.000Z')).toThrow()
  })
})
