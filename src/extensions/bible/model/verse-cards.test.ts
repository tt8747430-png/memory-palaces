import { describe, expect, it } from 'vitest'
import { addableCards, buildVerseCards, canSplit, findDuplicates } from './verse-cards'

const ref = { book: 'GEN' as const, chapter: 1, from: 1, to: 2 }

describe('buildVerseCards', () => {
  it('puts the reference on the front and only the text on the back', () => {
    const cards = buildVerseCards({ book: 'GEN', chapter: 1, from: 1, to: 1 }, 'In the beginning.')
    expect(cards).toEqual([{ front: 'Geneza 1:1', back: 'In the beginning.' }])
  })

  it('splits numbered verses into one card each', () => {
    const cards = buildVerseCards(ref, '1) In the beginning. 2) The earth was without form.')
    expect(cards).toEqual([
      { front: 'Geneza 1:1', back: 'In the beginning.' },
      { front: 'Geneza 1:2', back: 'The earth was without form.' },
    ])
  })

  it('splits bracketed chapter:verse markers too', () => {
    const cards = buildVerseCards(ref, '(1:1) In the beginning.\n(1:2) The earth was without form.')
    expect(cards).toEqual([
      { front: 'Geneza 1:1', back: 'In the beginning.' },
      { front: 'Geneza 1:2', back: 'The earth was without form.' },
    ])
  })

  it('makes one card for the whole range when the text carries no markers', () => {
    const cards = buildVerseCards(ref, 'In the beginning the earth was without form.')
    expect(cards).toEqual([
      { front: 'Geneza 1:1-2', back: 'In the beginning the earth was without form.' },
    ])
  })

  it('skips a verse left empty without swallowing the next one', () => {
    const cards = buildVerseCards({ ...ref, to: 3 }, '1) A.\n2) \n3) C.')
    expect(cards).toEqual([
      { front: 'Geneza 1:1', back: 'A.' },
      { front: 'Geneza 1:3', back: 'C.' },
    ])
  })

  it('makes nothing from empty text', () => {
    expect(buildVerseCards(ref, '   ')).toEqual([])
  })

  it('keys the fronts off the markers when no book has been picked', () => {
    expect(buildVerseCards(null, '(1:1) The elder, to Gaius\n(1:2) Beloved, I pray')).toEqual([
      { front: '1:1', back: 'The elder, to Gaius' },
      { front: '1:2', back: 'Beloved, I pray' },
    ])
  })

  it('makes nothing from unmarked text when no book has been picked — there is no front to give it', () => {
    expect(buildVerseCards(null, 'In the beginning, plainly.')).toEqual([])
  })

  it('never leaves a reference on a back', () => {
    const cards = buildVerseCards(ref, '1) Geneza 1:1 In the beginning. 2) The earth.')
    expect(cards[0]?.back).toBe('In the beginning.')
  })
})

describe('splitting', () => {
  it('keeps the range as one card when splitting is off', () => {
    const cards = buildVerseCards(ref, '1) In the beginning. 2) The earth.', { split: false })
    expect(cards).toEqual([{ front: 'Geneza 1:1-2', back: '1) In the beginning. 2) The earth.' }])
  })

  it('knows whether the text can be split at all', () => {
    expect(canSplit('1) In the beginning. 2) The earth.')).toBe(true)
    expect(canSplit('(1:1) In the beginning.')).toBe(true)
    expect(canSplit('In the beginning, plainly.')).toBe(false)
  })
})

describe('findDuplicates', () => {
  it('names references held anywhere in the library, with the deck holding them', () => {
    const cards = [
      { front: 'Geneza 1:1', back: 'a' },
      { front: 'Geneza 1:2', back: 'b' },
    ]
    const held = [{ front: 'Geneza 1:1', deckId: 'deck-7' }]
    expect(findDuplicates(cards, held)).toEqual([{ front: 'Geneza 1:1', deckId: 'deck-7' }])
  })

  it('finds a duplicate that lives in a different deck from the target', () => {
    const held = [{ front: 'Geneza 1:1', deckId: 'some-other-deck' }]
    expect(findDuplicates([{ front: 'Geneza 1:1', back: 'a' }], held)).toHaveLength(1)
  })

  it('finds none in an empty library', () => {
    expect(findDuplicates([{ front: 'Geneza 1:1', back: 'a' }], [])).toEqual([])
  })
})

describe('addableCards', () => {
  const built = [
    { front: 'Geneza 1:1', back: 'a' },
    { front: 'Geneza 1:2', back: 'b' },
  ]
  const duplicates = [{ front: 'Geneza 1:1', deckId: 'somewhere' }]

  it('drops the verses already held', () => {
    expect(addableCards(built, duplicates, false)).toEqual([{ front: 'Geneza 1:2', back: 'b' }])
  })

  it('keeps them when the learner says so', () => {
    expect(addableCards(built, duplicates, true)).toEqual(built)
  })
})

describe('what the old core parser did', () => {
  it('joins a verse that wraps onto the next line', () => {
    const cards = buildVerseCards(null, '3 John 1\n(1:1) The elder,\nto Gaius')
    expect(cards[0]?.back).toBe('The elder, to Gaius')
  })

  it('ignores a book header line above the markers', () => {
    const cards = buildVerseCards(
      null,
      '3 John 1\n(1:1) The elder, to Gaius\n(1:2) Beloved, I pray',
    )
    expect(cards).toHaveLength(2)
  })

  it('finds nothing in ordinary notes', () => {
    expect(buildVerseCards(null, 'Zeus, King of the gods')).toEqual([])
  })
})
