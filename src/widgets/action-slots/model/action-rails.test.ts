import { describe, expect, it } from 'vitest'
import type { SwipeConfig } from '@/shared/config/swipe'
import { flatToRails, ROW, railsToFlat } from './action-rails'

const config = (leading: string[], trailing: string[]): SwipeConfig =>
  ({ leading, trailing }) as SwipeConfig

describe('the rails as one list', () => {
  it('puts the row where the two rails meet', () => {
    expect(railsToFlat(config(['favorite'], ['move', 'delete']))).toEqual([
      'favorite',
      ROW,
      'move',
      'delete',
    ])
  })

  it('reads an action’s rail off which side of the row it sits on', () => {
    expect(flatToRails(['favorite', 'move', ROW, 'delete'])).toEqual({
      leading: ['favorite', 'move'],
      trailing: ['delete'],
    })
  })

  it('survives every round trip, including the empty rails', () => {
    for (const each of [config([], []), config([], ['delete']), config(['edit'], [])]) {
      expect(flatToRails(railsToFlat(each))).toEqual(each)
    }
  })

  it('reads a list that has lost its row as one that ends where it ends', () => {
    expect(flatToRails(['favorite', 'move'])).toEqual({
      leading: ['favorite', 'move'],
      trailing: [],
    })
  })
})
