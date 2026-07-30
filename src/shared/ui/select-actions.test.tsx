import { isValidElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { SelectActionId } from '@/shared/config/select-toolbar'
import { bulkAction, selectActionIcon } from './select-actions'

describe('bulkAction', () => {
  const selection = (ids: string[]) => ({ ids: new Set(ids), exit: vi.fn() })

  it('is disabled while nothing is selected', () => {
    expect(bulkAction(selection([]), vi.fn()).disabled).toBe(true)
    expect(bulkAction(selection(['a']), vi.fn()).disabled).toBe(false)
  })

  it('runs the command over the selected ids, then leaves select mode', () => {
    const chosen = selection(['a', 'b'])
    const run = vi.fn()
    bulkAction(chosen, run).onAction()
    expect(run).toHaveBeenCalledExactlyOnceWith(['a', 'b'])
    expect(chosen.exit).toHaveBeenCalledOnce()
  })

  it('hands the command a snapshot the exit cannot empty', () => {
    const ids = new Set(['a'])
    let seen: string[] = []
    const chosen = { ids, exit: () => ids.clear() }
    bulkAction(chosen, (batch) => {
      seen = batch
    }).onAction()
    expect(seen).toEqual(['a'])
  })

  it('does nothing when fired with an empty selection', () => {
    const chosen = selection([])
    const run = vi.fn()
    bulkAction(chosen, run).onAction()
    expect(run).not.toHaveBeenCalled()
    expect(chosen.exit).not.toHaveBeenCalled()
  })
})

describe('selectActionIcon', () => {
  it('returns a renderable icon element for every action id', () => {
    const ids: SelectActionId[] = [
      'move',
      'favorite',
      'duplicate',
      'archive',
      'unfile',
      'flag',
      'known',
      'reset',
      'delete',
    ]
    for (const id of ids) {
      expect(isValidElement(selectActionIcon(id))).toBe(true)
    }
  })
})
