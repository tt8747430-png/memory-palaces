import { describe, expect, it } from 'vitest'
import { mergeFields } from './merge-fields'

interface Doc {
  id: string
  updatedAt: string
  front: string
  back: string
  count: number
  tags?: string[]
  _deleted: boolean
}

const base: Doc = {
  id: 'c1',
  updatedAt: 't1',
  front: 'F',
  back: 'B',
  count: 10,
  _deleted: false,
}

describe('mergeFields', () => {
  it('keeps the field each side changed, when they changed different ones', () => {
    const mine = { ...base, updatedAt: 't3', count: 11 }
    const theirs = { ...base, updatedAt: 't2', back: 'edited elsewhere' }
    expect(mergeFields(mine, theirs, base)).toEqual({
      ...base,
      updatedAt: 't3',
      count: 11,
      back: 'edited elsewhere',
    })
  })

  it('gives a field both changed to the newer clock', () => {
    const mine = { ...base, updatedAt: 't2', front: 'mine' }
    const theirs = { ...base, updatedAt: 't3', front: 'theirs' }
    expect(mergeFields(mine, theirs, base).front).toBe('theirs')
    expect(mergeFields(theirs, mine, base).front).toBe('theirs')
  })

  it('lets this device win a tie when told to', () => {
    const mine = { ...base, updatedAt: 't2', front: 'mine' }
    const theirs = { ...base, updatedAt: 't3', front: 'theirs' }
    expect(mergeFields(mine, theirs, base, { tie: 'mine' }).front).toBe('mine')
  })

  it('settles a field both changed by its own rule', () => {
    const mine = { ...base, updatedAt: 't2', count: 15 }
    const theirs = { ...base, updatedAt: 't3', count: 12 }
    const merged = mergeFields(mine, theirs, base, {
      both: { count: (a, b, seen) => seen + (a - seen) + (b - seen) },
    })
    expect(merged.count).toBe(17)
  })

  it('carries a deletion one side made while the other left the document alone', () => {
    const mine = { ...base, updatedAt: 't2', _deleted: true }
    const theirs = { ...base, updatedAt: 't3', count: 11 }
    expect(mergeFields(mine, theirs, base)).toMatchObject({ _deleted: true, count: 11 })
  })

  it('compares as data, so a nested value in another key order is not a change', () => {
    const seen = { ...base, tags: ['a', 'b'] }
    const mine = { ...seen, updatedAt: 't2', tags: ['a', 'b'] }
    const theirs = { ...seen, updatedAt: 't3', tags: ['c'] }
    expect(mergeFields(mine, theirs, seen).tags).toEqual(['c'])
  })

  it('takes a field only one side has at all', () => {
    const mine: Doc = { ...base, updatedAt: 't2', tags: ['new'] }
    const theirs: Doc = { ...base, updatedAt: 't3' }
    expect(mergeFields(mine, theirs, base).tags).toEqual(['new'])
    const gone = mergeFields({ ...base, updatedAt: 't3' }, { ...base, updatedAt: 't2' }, mine)
    expect('tags' in gone).toBe(false)
  })

  it('stamps the later clock, so the merged document is refused by neither side', () => {
    const mine = { ...base, updatedAt: 't2' }
    const theirs = { ...base, updatedAt: 't5' }
    expect(mergeFields(mine, theirs, base).updatedAt).toBe('t5')
    expect(mergeFields(theirs, mine, base).updatedAt).toBe('t5')
  })
})
