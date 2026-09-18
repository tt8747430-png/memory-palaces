import { describe, expect, it } from 'vitest'
import { indexLibrary } from './library-index'
import { textFromCards } from './text-from-cards'
import { makeBibleVerse } from './verse'

const held = indexLibrary([
  makeBibleVerse({
    createdAt: 't0',
    translation: 'cornilescu-2024',
    book: 'JHN',
    chapter: 3,
    verse: 16,
    text: 'held',
  }),
])

describe('textFromCards', () => {
  it('splits the verse cards into the ones the library lacks and the ones it holds', () => {
    const found = textFromCards(
      [
        { front: 'Ioan 3:16', back: 'pasted' },
        { front: 'Ioan 3:17', back: 'new' },
        { front: 'Zeus', back: 'not a verse' },
        { front: 'Ioan 3:18-19', back: 'a range' },
      ],
      held,
      't1',
    )
    expect(found.cards).toBe(2)
    expect(found.held).toBe(1)
    expect(found.fresh.map((verse) => [verse.id, verse.text])).toEqual([
      ['cornilescu-2024:JHN:3:17', 'new'],
    ])
  })

  it('counts a verse once, however many cards carry it', () => {
    const found = textFromCards(
      [
        { front: 'Ioan 3:17', back: 'one' },
        { front: 'Ioan 3:17', back: 'two' },
      ],
      held,
      't1',
    )
    expect(found.fresh).toHaveLength(1)
    expect(found.cards).toBe(2)
  })
})
