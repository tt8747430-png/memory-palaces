import { describe, expect, it } from 'vitest'
import { versesFromCards } from './verse-sources'

const at = new Date(0).toISOString()

describe('versesFromCards', () => {
  it('reads book, chapter and verse off the front and text off the back', () => {
    const verses = versesFromCards(
      [{ front: 'Genesis 1:1', back: 'In the beginning God created.' }],
      at,
    )
    expect(verses).toEqual([
      expect.objectContaining({
        id: 'web:Genesis:1:1',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        text: 'In the beginning God created.',
      }),
    ])
  })

  it('strips a reference the back still carries', () => {
    const verses = versesFromCards(
      [{ front: 'Genesis 1:1', back: 'Genesis 1:1 In the beginning God created.' }],
      at,
    )
    expect(verses[0]?.text).toBe('In the beginning God created.')
  })

  it('skips a card whose front is not a reference', () => {
    expect(versesFromCards([{ front: 'Zeus', back: 'King of the gods' }], at)).toEqual([])
  })

  it('skips a range front — a source verse is one verse', () => {
    expect(versesFromCards([{ front: 'Genesis 1:1-31', back: 'the whole chapter' }], at)).toEqual(
      [],
    )
  })

  it('skips a card whose back is empty once stripped', () => {
    expect(versesFromCards([{ front: 'Genesis 1:1', back: 'Genesis 1:1' }], at)).toEqual([])
  })
})
