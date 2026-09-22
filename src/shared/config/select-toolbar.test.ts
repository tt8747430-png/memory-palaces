import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SELECT_TOOLBAR,
  normalizeSelectToolbar,
  SELECT_TOOLBAR_MAX,
  selectToolbarCanShrink,
  selectToolbarHasRoom,
  type SelectActionId,
} from './select-toolbar'

describe('normalizeSelectToolbar', () => {
  it('drops actions the surface does not offer', () => {
    expect(normalizeSelectToolbar('question', ['duplicate', 'archive', 'delete'])).toEqual([
      'duplicate',
      'delete',
    ])
  })

  it('keeps only what fits in the bar', () => {
    const overfull: SelectActionId[] = ['move', 'favorite', 'duplicate', 'archive', 'unfile']
    expect(normalizeSelectToolbar('library', overfull)).toHaveLength(SELECT_TOOLBAR_MAX)
  })

  it('de-duplicates repeated actions', () => {
    expect(normalizeSelectToolbar('card', ['flag', 'flag', 'delete'])).toEqual(['flag', 'delete'])
  })

  it('falls back to the default bar rather than leaving a selection with nothing to do', () => {
    expect(normalizeSelectToolbar('library', [])).toEqual(DEFAULT_SELECT_TOOLBAR.library)
    expect(normalizeSelectToolbar('card', undefined)).toEqual(DEFAULT_SELECT_TOOLBAR.card)
    expect(normalizeSelectToolbar('card', ['archive'] as unknown as SelectActionId[])).toEqual(
      DEFAULT_SELECT_TOOLBAR.card,
    )
  })
})

describe('what the bar will hold', () => {
  it('has room below its maximum and none at it', () => {
    expect(selectToolbarHasRoom(['move', 'delete'])).toBe(true)
    expect(selectToolbarHasRoom(['move', 'flag', 'known', 'delete'])).toBe(false)
  })

  it('lets an action come off while more than one is on, and keeps the last', () => {
    expect(selectToolbarCanShrink(['move', 'delete'])).toBe(true)
    expect(selectToolbarCanShrink(['delete'])).toBe(false)
  })
})
