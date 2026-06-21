import { describe, expect, it } from 'vitest'
import {
  ContentImportError,
  lociToAnkiTsv,
  lociToCsv,
  parseAnkiText,
  parsePastedLoci,
  parseRoomContent,
  parseVerses,
  questionsToCsv,
  roomContentToJson,
} from './content-transfer'

describe('parsePastedLoci', () => {
  it('splits each line on the first comma/tab/semicolon', () => {
    const loci = parsePastedLoci('Zeus, King of the gods\nPoseidon\tGod of the sea\nskip-me')
    expect(loci).toEqual([
      { front: 'Zeus', back: 'King of the gods' },
      { front: 'Poseidon', back: 'God of the sea' },
    ])
  })
})

describe('parseAnkiText', () => {
  it('parses tab-separated notes, skipping # directives and stripping HTML', () => {
    const loci = parseAnkiText('#separator:tab\n#html:true\nFront 1\tBack <b>1</b>\nFront 2\tBack 2')
    expect(loci).toEqual([
      { front: 'Front 1', back: 'Back 1' },
      { front: 'Front 2', back: 'Back 2' },
    ])
  })
})

describe('parseVerses', () => {
  it('turns (chapter:verse) lines into cards prefixed with the book', () => {
    const loci = parseVerses('3 John 1\n(1:1) The elder, to Gaius\n(1:2) Beloved, I pray')
    expect(loci).toEqual([
      { front: '3 John 1:1', back: '3 John 1:1 The elder, to Gaius' },
      { front: '3 John 1:2', back: '3 John 1:2 Beloved, I pray' },
    ])
  })
})

describe('parseRoomContent', () => {
  it('reads a cards CSV (front,back,hint)', () => {
    const content = parseRoomContent('front,back,hint\nZeus,King,On a throne', 'deck.csv')
    expect(content.loci).toEqual([{ front: 'Zeus', back: 'King', hint: 'On a throne' }])
    expect(content.questions).toEqual([])
  })

  it('reads a questions CSV with a 1-based answer column', () => {
    const content = parseRoomContent('prompt,option1,option2,answer\nClosest planet?,Mercury,Venus,1', 'q.csv')
    expect(content.questions).toEqual([
      { prompt: 'Closest planet?', options: ['Mercury', 'Venus'], correctAnswer: 0 },
    ])
  })

  it('round-trips JSON exported by the app', () => {
    const json = roomContentToJson(
      'Room',
      [{ front: 'a', back: 'A' }],
      [{ prompt: 'p?', options: ['x', 'y'], correctAnswer: 1 }],
    )
    const content = parseRoomContent(json, 'room.json')
    expect(content.loci).toEqual([{ front: 'a', back: 'A' }])
    expect(content.questions).toEqual([{ prompt: 'p?', options: ['x', 'y'], correctAnswer: 1 }])
  })

  it('throws a ContentImportError when nothing usable is found', () => {
    expect(() => parseRoomContent('not, a, deck\n', 'junk.csv')).toThrow(ContentImportError)
  })
})

describe('serializers', () => {
  it('emits a cards CSV header', () => {
    expect(lociToCsv([{ front: 'a', back: 'A' }]).split('\n')[0]).toBe('front,back,hint')
  })

  it('emits a questions CSV with a 1-based answer', () => {
    const csv = questionsToCsv([{ prompt: 'p', options: ['x', 'y'], correctAnswer: 1 }])
    expect(csv.split('\n')[1]).toBe('p,x,y,2,')
  })

  it('emits Anki plain-text directives', () => {
    expect(lociToAnkiTsv([{ front: 'a', back: 'A' }])).toContain('#separator:tab')
  })
})
