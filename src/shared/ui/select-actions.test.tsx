import { isValidElement } from 'react'
import { describe, expect, it } from 'vitest'
import type { SelectActionId } from '@/shared/config/select-toolbar'
import { selectActionIcon } from './select-actions'

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
