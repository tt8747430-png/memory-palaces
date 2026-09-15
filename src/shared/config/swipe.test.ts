import { describe, expect, it } from 'vitest'
import { CARD_ACTIONS } from './actions'
import { DEFAULT_SWIPE, normalizeSwipeConfig, SWIPE_ACTIONS, withoutSwipeAction } from './swipe'

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
