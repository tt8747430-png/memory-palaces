import { describe, expect, it } from 'vitest'
import { placeOfDestination } from './move-destination'

describe('placeOfDestination', () => {
  it('names the place each destination stands a deck at', () => {
    expect(placeOfDestination({ kind: 'home' })).toEqual({ parentId: null, folderId: null })
    expect(placeOfDestination({ kind: 'folder', folderId: 'f1' })).toEqual({
      parentId: null,
      folderId: 'f1',
    })
    expect(placeOfDestination({ kind: 'deck', deckId: 'd1' })).toEqual({
      parentId: 'd1',
      folderId: null,
    })
  })

  it('has no place for the archive — that is the archive act', () => {
    expect(placeOfDestination({ kind: 'archive' })).toBeNull()
  })
})
