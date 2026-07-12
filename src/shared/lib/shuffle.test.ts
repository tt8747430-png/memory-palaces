import { describe, expect, it } from 'vitest'
import { shuffle } from './shuffle'

function rngFrom(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length] ?? 0
}

describe('shuffle', () => {
  it('returns a new array and never mutates the input', () => {
    const input = [1, 2, 3]
    const out = shuffle(input, () => 0)
    expect(out).not.toBe(input)
    expect(input).toEqual([1, 2, 3])
  })

  it('produces a permutation (every element preserved, none added)', () => {
    const input = ['a', 'b', 'c', 'd', 'e']
    const out = shuffle(input, rngFrom([0.7, 0.2, 0.9, 0.4, 0.1]))
    expect([...out].sort()).toEqual([...input].sort())
  })

  it('is deterministic for a fixed random source', () => {
    const seq = [0.9, 0.1, 0.5, 0.3]
    expect(shuffle([1, 2, 3, 4], rngFrom(seq))).toEqual(shuffle([1, 2, 3, 4], rngFrom(seq)))
  })

  it('leaves empty and single-element arrays unchanged', () => {
    expect(shuffle([], () => 0.5)).toEqual([])
    expect(shuffle([42], () => 0.5)).toEqual([42])
  })
})
