import { describe, expect, it } from 'vitest'
import {
  cardsToAnkiTsv,
  cardsToCsv,
  ContentImportError,
  detectPasteFormat,
  guessFieldSeparator,
  parseAnkiText,
  parseDeckContent,
  parseDelimitedNotes,
  parsePastedCards,
  parseVerses,
  questionsToCsv,
} from './content-transfer'

describe('parsePastedCards', () => {
  it('splits each line on the first comma/tab/semicolon', () => {
    const cards = parsePastedCards('Zeus, King of the gods\nPoseidon\tGod of the sea\nskip-me')
    expect(cards).toEqual([
      { front: 'Zeus', back: 'King of the gods' },
      { front: 'Poseidon', back: 'God of the sea' },
    ])
  })
})

describe('parseAnkiText', () => {
  it('parses tab-separated notes, skipping # directives and stripping HTML', () => {
    const cards = parseAnkiText(
      '#separator:tab\n#html:true\nFront 1\tBack <b>1</b>\nFront 2\tBack 2',
    )
    expect(cards).toEqual([
      { front: 'Front 1', back: 'Back 1' },
      { front: 'Front 2', back: 'Back 2' },
    ])
  })
})

describe('parseVerses', () => {
  it('turns (chapter:verse) lines into cards prefixed with the book', () => {
    const cards = parseVerses('3 John 1\n(1:1) The elder, to Gaius\n(1:2) Beloved, I pray')
    expect(cards).toEqual([
      { front: '3 John 1:1', back: '3 John 1:1 The elder, to Gaius' },
      { front: '3 John 1:2', back: '3 John 1:2 Beloved, I pray' },
    ])
  })
})

describe('parseDelimitedNotes', () => {
  it('splits on the chosen field and card separators', () => {
    const cards = parseDelimitedNotes('a=1;b=2', { field: '=', card: ';' })
    expect(cards).toEqual([
      { front: 'a', back: '1' },
      { front: 'b', back: '2' },
    ])
  })

  it('splits on tab between sides and newline between cards', () => {
    const cards = parseDelimitedNotes('a\t1\r\nb\t2', { field: '\t', card: '\n' })
    expect(cards).toEqual([
      { front: 'a', back: '1' },
      { front: 'b', back: '2' },
    ])
  })

  it('only splits on the first field separator, keeping the rest in back', () => {
    const cards = parseDelimitedNotes('Zeus,King, of the gods', { field: ',', card: '\n' })
    expect(cards).toEqual([{ front: 'Zeus', back: 'King, of the gods' }])
  })

  it('skips blank chunks and lines without a separator', () => {
    const cards = parseDelimitedNotes('a,1\n\nnope\nb,2', { field: ',', card: '\n' })
    expect(cards).toEqual([
      { front: 'a', back: '1' },
      { front: 'b', back: '2' },
    ])
  })

  it('swaps front and back when asked', () => {
    const cards = parseDelimitedNotes('King,Zeus', { field: ',', card: '\n', swap: true })
    expect(cards).toEqual([{ front: 'Zeus', back: 'King' }])
  })

  it('drops the first non-empty row when skipHeader is set', () => {
    const cards = parseDelimitedNotes('front,back\nZeus,King', {
      field: ',',
      card: '\n',
      skipHeader: true,
    })
    expect(cards).toEqual([{ front: 'Zeus', back: 'King' }])
  })
})

describe('detectPasteFormat', () => {
  it('reads a dominant verse paste as bible', () => {
    expect(detectPasteFormat('John 3\n(3:16) For God so loved…\n(3:17) For God sent…')).toBe(
      'bible',
    )
  })

  it('reads delimited pairs as notes', () => {
    expect(detectPasteFormat('Zeus, King\nHera, Queen')).toBe('notes')
  })

  it('falls back to notes on empty text', () => {
    expect(detectPasteFormat('   ')).toBe('notes')
  })
})

describe('guessFieldSeparator', () => {
  it('prefers a tab over a comma', () => {
    expect(guessFieldSeparator('a\tb,c')).toBe('\t')
  })

  it('picks the comma when there is no tab', () => {
    expect(guessFieldSeparator('a,b')).toBe(',')
  })

  it('defaults to tab when the line has no known separator', () => {
    expect(guessFieldSeparator('plainline')).toBe('\t')
  })
})

describe('parseDeckContent', () => {
  it('reads a cards CSV (front,back,hint)', () => {
    const content = parseDeckContent('front,back,hint\nZeus,King,On a throne')
    expect(content.cards).toEqual([{ front: 'Zeus', back: 'King', hint: 'On a throne' }])
    expect(content.questions).toEqual([])
  })

  it('reads a questions CSV with a 1-based answer column', () => {
    const content = parseDeckContent(
      'prompt,option1,option2,answer\nClosest planet?,Mercury,Venus,1',
    )
    expect(content.questions).toEqual([
      { prompt: 'Closest planet?', options: ['Mercury', 'Venus'], correctAnswer: 0 },
    ])
  })

  it('throws a ContentImportError when nothing usable is found', () => {
    expect(() => parseDeckContent('not, a, deck\n')).toThrow(ContentImportError)
  })
})

describe('serializers', () => {
  it('emits a cards CSV header', () => {
    expect(cardsToCsv([{ front: 'a', back: 'A' }]).split('\n')[0]).toBe('front,back,hint')
  })

  it('emits a questions CSV with a 1-based answer', () => {
    const csv = questionsToCsv([{ prompt: 'p', options: ['x', 'y'], correctAnswer: 1 }])
    expect(csv.split('\n')[1]).toBe('p,x,y,2,')
  })

  it('emits Anki plain-text directives', () => {
    expect(cardsToAnkiTsv([{ front: 'a', back: 'A' }])).toContain('#separator:tab')
  })
})
