import { describe, expect, it } from 'vitest'
import { reinsertAhead, REINSERT_AHEAD } from './fast-review'

describe('reinsertAhead', () => {
  it('drops the card a few places down the queue', () => {
    expect(reinsertAhead(['b', 'c', 'd', 'e', 'f'], 'a', 3)).toEqual(['b', 'c', 'd', 'a', 'e', 'f'])
  })

  it('keeps a card behind it when the queue is shorter than the gap', () => {
    expect(reinsertAhead(['b'], 'a', 4)).toEqual(['a', 'b'])
    expect(reinsertAhead(['b', 'c'], 'a', 4)).toEqual(['b', 'a', 'c'])
  })

  it('still returns the card when the queue is empty — Not quite never retires a card', () => {
    expect(reinsertAhead([], 'a')).toEqual(['a'])
  })

  it('defaults to four places, which is close enough to feel more frequent', () => {
    expect(REINSERT_AHEAD).toBe(4)
  })
})
