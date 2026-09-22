import { describe, expect, it } from 'vitest'
import { CARD_ACTIONS } from './actions'
import {
  DEFAULT_SWIPE,
  normalizeSwipeConfig,
  railsFit,
  railWithRoom,
  SWIPE_ACTIONS,
  type SwipeConfig,
  withoutSwipeAction,
  withSwipeAction,
} from './swipe'

const config = (leading: string[], trailing: string[]): SwipeConfig =>
  ({ leading, trailing }) as SwipeConfig

describe('withoutSwipeAction', () => {
  it('takes the action off whichever side holds it and leaves the rest in order', () => {
    expect(
      withoutSwipeAction(
        { leading: ['favorite', 'move'], trailing: ['delete', 'archive'] },
        'move',
      ),
    ).toEqual({ leading: ['favorite'], trailing: ['delete', 'archive'] })
  })

  it('changes nothing for an action on neither side', () => {
    const config = { leading: ['favorite' as const], trailing: [] }
    expect(withoutSwipeAction(config, 'delete')).toEqual(config)
  })
})

describe('card swipe actions', () => {
  it('offers every card action the menu does', () => {
    expect(SWIPE_ACTIONS.card).toEqual(CARD_ACTIONS)
  })

  it('keeps the defaults inside the rails they have to fit', () => {
    const normalized = normalizeSwipeConfig('card', DEFAULT_SWIPE.card)
    expect(normalized).toEqual(DEFAULT_SWIPE.card)
  })

  it('drops an action a stored config claims but this kind does not offer', () => {
    expect(normalizeSwipeConfig('folder', { leading: ['grade'], trailing: ['delete'] })).toEqual({
      leading: [],
      trailing: ['delete'],
    })
  })
})

describe('what a rail will hold', () => {
  it('fits the defaults, and refuses a leading rail of three', () => {
    expect(railsFit(config(['favorite'], ['move', 'archive', 'delete']))).toBe(true)
    expect(railsFit(config(['a', 'b', 'c'], []))).toBe(false)
  })

  it('refuses a trailing rail of five', () => {
    expect(railsFit(config([], ['a', 'b', 'c', 'd', 'e']))).toBe(false)
  })

  it('adds to the right-hand rail while it has room', () => {
    expect(railWithRoom(config(['favorite'], ['move']))).toBe('trailing')
  })

  it('falls to the left-hand rail once the right is full', () => {
    expect(railWithRoom(config([], ['a', 'b', 'c', 'd']))).toBe('leading')
  })

  it('has nowhere to put one when both are full', () => {
    expect(railWithRoom(config(['a', 'b'], ['c', 'd', 'e', 'f']))).toBeNull()
  })
})

describe('withSwipeAction', () => {
  it('adds at the end of the right-hand rail', () => {
    expect(withSwipeAction(config(['favorite'], ['move']), 'delete')).toEqual(
      config(['favorite'], ['move', 'delete']),
    )
  })

  it('falls to the left-hand rail once the right is full', () => {
    const right = ['move', 'archive', 'duplicate', 'delete']
    expect(withSwipeAction(config([], right), 'favorite')).toEqual(config(['favorite'], right))
  })

  it('leaves the rails as they are when both are full', () => {
    const full = config(['favorite', 'settings'], ['move', 'archive', 'duplicate', 'delete'])
    expect(withSwipeAction(full, 'addSubdeck')).toBe(full)
  })
})
