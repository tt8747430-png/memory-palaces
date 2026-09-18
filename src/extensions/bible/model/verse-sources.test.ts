import { describe, expect, it } from 'vitest'
import { versesFromCards } from './verse-sources'
import { DEFAULT_TRANSLATION } from './translations'

const at = new Date(0).toISOString()

describe('versesFromCards', () => {
  it('reads book, chapter and verse off the front and text off the back', () => {
    const verses = versesFromCards(
      [{ front: 'Geneza 1:1', back: 'In the beginning God created.' }],
      DEFAULT_TRANSLATION,
      at,
    )
    expect(verses).toEqual([
      expect.objectContaining({
        id: 'cornilescu-2024:GEN:1:1',
        book: 'GEN',
        chapter: 1,
        verse: 1,
        text: 'In the beginning God created.',
      }),
    ])
  })

  it('strips a reference the back still carries', () => {
    const verses = versesFromCards(
      [{ front: 'Geneza 1:1', back: 'Geneza 1:1 In the beginning God created.' }],
      DEFAULT_TRANSLATION,
      at,
    )
    expect(verses[0]?.text).toBe('In the beginning God created.')
  })

  it('reads the learner’s existing Romanian fronts', () => {
    const [verse] = versesFromCards(
      [{ front: '1 Corinteni 8:9', back: 'Luați seama' }],
      DEFAULT_TRANSLATION,
      at,
    )
    expect(verse?.id).toBe('cornilescu-2024:1CO:8:9')
  })

  it('skips a card whose front is not a reference', () => {
    expect(
      versesFromCards([{ front: 'Zeus', back: 'King of the gods' }], DEFAULT_TRANSLATION, at),
    ).toEqual([])
  })

  it('skips a range front — a source verse is one verse', () => {
    expect(
      versesFromCards(
        [{ front: 'Geneza 1:1-31', back: 'the whole chapter' }],
        DEFAULT_TRANSLATION,
        at,
      ),
    ).toEqual([])
  })

  it('skips a card whose back is empty once stripped', () => {
    expect(
      versesFromCards([{ front: 'Geneza 1:1', back: 'Geneza 1:1' }], DEFAULT_TRANSLATION, at),
    ).toEqual([])
  })
})
