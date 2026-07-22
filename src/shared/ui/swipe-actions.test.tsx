import { isValidElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { TFunction } from 'i18next'
import type { SwipeConfig } from '@/shared/config/swipe'
import { buildSwipeActions, swipeActionIcon, type SwipeActionHandlers } from './swipe-actions'

const t = ((key: string) => key) as unknown as TFunction

describe('swipeActionIcon', () => {
  it('returns a renderable icon for a known action', () => {
    expect(isValidElement(swipeActionIcon('delete'))).toBe(true)
  })
})

describe('buildSwipeActions', () => {
  it('resolves only the configured ids that have a handler', () => {
    const config: SwipeConfig = { leading: ['flag'], trailing: ['delete', 'move'] }
    const onFlag = vi.fn()
    const onDelete = vi.fn()
    const handlers: SwipeActionHandlers = {
      flag: { onAction: onFlag, label: 'Flag it' },
      delete: { onAction: onDelete },
      // no handler for 'move' — it should be dropped
    }

    const { leading, trailing } = buildSwipeActions(config, handlers, t)

    expect(leading).toHaveLength(1)
    expect(leading[0]).toMatchObject({ id: 'flag', label: 'Flag it', onAction: onFlag })

    expect(trailing).toHaveLength(1)
    expect(trailing[0]).toMatchObject({ id: 'delete', onAction: onDelete })
    // falls back to the translated label key when the handler omits one
    expect(trailing[0]?.label).toBe('swipe.actions.delete')
  })
})
