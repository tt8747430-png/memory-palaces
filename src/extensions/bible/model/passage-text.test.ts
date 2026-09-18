import { describe, expect, it } from 'vitest'
import { indexLibrary } from './library-index'
import { passagePrefill } from './passage-text'
import { makeBibleVerse } from './verse'

const verse = (number: number, text: string) =>
  makeBibleVerse({
    createdAt: 't0',
    translation: 'cornilescu-2024',
    book: 'JHN',
    chapter: 3,
    verse: number,
    text,
  })

describe('passagePrefill', () => {
  const index = indexLibrary([verse(16, 'Fiindcă'), verse(18, 'Oricine')])

  it('puts one verse on each line, a missing one as its bare marker', () => {
    expect(passagePrefill({ book: 'JHN', chapter: 3, from: 16, to: 18 }, index)).toEqual({
      text: '16) Fiindcă\n17) \n18) Oricine',
      held: 2,
      missing: [17],
    })
  })

  it('is empty when the library holds none of it', () => {
    expect(passagePrefill({ book: 'JHN', chapter: 4, from: 1, to: 2 }, index)).toEqual({
      text: '',
      held: 0,
      missing: [1, 2],
    })
  })
})
