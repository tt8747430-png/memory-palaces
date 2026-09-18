import { describe, expect, it } from 'vitest'
import { createStoredVerseSource } from './verse-text'
import { makeBibleVerse } from './verse'

const at = new Date(0).toISOString()
const verse = (chapter: number, number: number, text: string) =>
  makeBibleVerse({ createdAt: at, book: 'Genesis', chapter, verse: number, text })

describe('createStoredVerseSource', () => {
  it('reads a range in verse order', async () => {
    const source = createStoredVerseSource([verse(1, 2, 'second'), verse(1, 1, 'first')])
    expect(await source.read({ book: 'Genesis', chapter: 1, from: 1, to: 2 })).toEqual([
      { verse: 1, text: 'first' },
      { verse: 2, text: 'second' },
    ])
  })

  it('returns nothing for a range it does not hold — an absent passage is not an error', async () => {
    const source = createStoredVerseSource([verse(1, 1, 'first')])
    expect(await source.read({ book: 'Exodus', chapter: 1, from: 1, to: 3 })).toEqual([])
  })

  it('returns only the verses it holds inside the range', async () => {
    const source = createStoredVerseSource([verse(1, 1, 'first'), verse(1, 3, 'third')])
    expect(await source.read({ book: 'Genesis', chapter: 1, from: 1, to: 3 })).toEqual([
      { verse: 1, text: 'first' },
      { verse: 3, text: 'third' },
    ])
  })
})
