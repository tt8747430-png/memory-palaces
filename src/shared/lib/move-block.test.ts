import { describe, expect, it } from 'vitest'
import { moveBlock } from './move-block'

const ids = ['a', 'b', 'c', 'd', 'e']

describe('moveBlock', () => {
  it('moves a single row down, landing it after the target', () => {
    expect(moveBlock(ids, new Set(['a']), 'c')).toEqual(['b', 'c', 'a', 'd', 'e'])
  })

  it('moves a single row up, landing it before the target', () => {
    expect(moveBlock(ids, new Set(['e']), 'c')).toEqual(['a', 'b', 'e', 'c', 'd'])
  })

  it('keeps a carried block contiguous and in its own order', () => {
    expect(moveBlock(ids, new Set(['a', 'c']), 'e')).toEqual(['b', 'd', 'e', 'a', 'c'])
  })

  it('lands a block dragged upwards before the target', () => {
    expect(moveBlock(ids, new Set(['d', 'e']), 'b')).toEqual(['a', 'd', 'e', 'b', 'c'])
  })

  it('treats the block as coming from its topmost row', () => {
    // `b` is carried and sits above `d`, so the block lands after `d` even though `e` is below it.
    expect(moveBlock(ids, new Set(['b', 'e']), 'd')).toEqual(['a', 'c', 'd', 'b', 'e'])
  })

  it('is a no-op when dropped onto a row it is already carrying', () => {
    expect(moveBlock(ids, new Set(['a', 'b']), 'b')).toEqual(ids)
  })

  it('is a no-op for a target that is not in the list', () => {
    expect(moveBlock(ids, new Set(['a']), 'zzz')).toEqual(ids)
  })

  it('is a no-op when nothing is carried', () => {
    expect(moveBlock(ids, new Set(), 'c')).toEqual(ids)
  })

  it('returns a copy rather than the input array', () => {
    const result = moveBlock(ids, new Set(), 'c')
    expect(result).not.toBe(ids)
  })
})
