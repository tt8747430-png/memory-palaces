import { describe, expect, it } from 'vitest'
import { withoutSwipeAction } from './swipe'

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
