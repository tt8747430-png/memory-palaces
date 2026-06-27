import { describe, expect, it } from 'vitest'
import {
  buildTiles,
  initMatch,
  MAX_PAIRS,
  matchReducer,
  remainingPairs,
  type Tile,
} from './match-machine'

const tiles: Tile[] = [
  { id: 'a-t', locusId: 'a', kind: 'term', text: 'Alpha' },
  { id: 'a-d', locusId: 'a', kind: 'def', text: 'first letter' },
  { id: 'b-t', locusId: 'b', kind: 'term', text: 'Beta' },
  { id: 'b-d', locusId: 'b', kind: 'def', text: 'second letter' },
]

const play = () => initMatch(tiles)

describe('buildTiles', () => {
  it('makes a term + def tile for each locus', () => {
    const built = buildTiles(
      [
        { id: 'l1', front: 'A', back: 'aaa' },
        { id: 'l2', front: 'B', back: 'bbb' },
      ],
      () => 0,
    )
    expect(built).toHaveLength(4)
    const byLocus = built.filter((tile) => tile.locusId === 'l1')
    expect(byLocus.map((tile) => tile.kind).sort()).toEqual(['def', 'term'])
    expect(byLocus.find((tile) => tile.kind === 'term')?.text).toBe('A')
    expect(byLocus.find((tile) => tile.kind === 'def')?.text).toBe('aaa')
  })

  it('caps the board at MAX_PAIRS pairs', () => {
    const loci = Array.from({ length: MAX_PAIRS + 3 }, (_, i) => ({
      id: `l${i}`,
      front: `f${i}`,
      back: `b${i}`,
    }))
    expect(buildTiles(loci, () => 0)).toHaveLength(MAX_PAIRS * 2)
  })
})

describe('initMatch', () => {
  it('starts playing with nothing selected or matched', () => {
    expect(play()).toEqual({
      tiles,
      selected: [],
      matched: [],
      wrong: [],
      moves: 0,
      status: 'playing',
    })
  })
})

describe('pick', () => {
  it('selects the first tile without counting a move', () => {
    const next = matchReducer(play(), { type: 'pick', tileId: 'a-t' })
    expect(next.selected).toEqual(['a-t'])
    expect(next.moves).toBe(0)
  })

  it('deselects a tile picked twice', () => {
    const one = matchReducer(play(), { type: 'pick', tileId: 'a-t' })
    expect(matchReducer(one, { type: 'pick', tileId: 'a-t' }).selected).toEqual([])
  })

  it('matches a term with its definition and clears the selection', () => {
    const one = matchReducer(play(), { type: 'pick', tileId: 'a-t' })
    const matched = matchReducer(one, { type: 'pick', tileId: 'a-d' })
    expect(matched.matched.sort()).toEqual(['a-d', 'a-t'])
    expect(matched.selected).toEqual([])
    expect(matched.moves).toBe(1)
    expect(matched.status).toBe('playing')
  })

  it('flags a mismatch as wrong, counting the move', () => {
    const one = matchReducer(play(), { type: 'pick', tileId: 'a-t' })
    const wrong = matchReducer(one, { type: 'pick', tileId: 'b-t' })
    expect(wrong.wrong.sort()).toEqual(['a-t', 'b-t'])
    expect(wrong.matched).toEqual([])
    expect(wrong.moves).toBe(1)
  })

  it('locks the board while a wrong pair is showing', () => {
    const wrong = matchReducer(matchReducer(play(), { type: 'pick', tileId: 'a-t' }), {
      type: 'pick',
      tileId: 'b-t',
    })
    expect(matchReducer(wrong, { type: 'pick', tileId: 'a-d' })).toBe(wrong)
  })

  it('wins when the last pair is matched', () => {
    let state = play()
    state = matchReducer(state, { type: 'pick', tileId: 'a-t' })
    state = matchReducer(state, { type: 'pick', tileId: 'a-d' })
    state = matchReducer(state, { type: 'pick', tileId: 'b-t' })
    state = matchReducer(state, { type: 'pick', tileId: 'b-d' })
    expect(state.status).toBe('won')
    expect(state.matched).toHaveLength(4)
  })
})

describe('clearWrong + reset', () => {
  it('clears a wrong pair back to an empty selection', () => {
    const wrong = matchReducer(matchReducer(play(), { type: 'pick', tileId: 'a-t' }), {
      type: 'pick',
      tileId: 'b-t',
    })
    const cleared = matchReducer(wrong, { type: 'clearWrong' })
    expect(cleared.wrong).toEqual([])
    expect(cleared.selected).toEqual([])
  })

  it('reset starts a fresh board from new tiles', () => {
    const fresh = matchReducer(play(), { type: 'reset', tiles })
    expect(fresh).toEqual(initMatch(tiles))
  })
})

describe('remainingPairs', () => {
  it('is the count of unmatched pairs', () => {
    expect(remainingPairs(play())).toBe(2)
    const one = matchReducer(
      matchReducer(play(), { type: 'pick', tileId: 'a-t' }),
      { type: 'pick', tileId: 'a-d' },
    )
    expect(remainingPairs(one)).toBe(1)
  })
})
