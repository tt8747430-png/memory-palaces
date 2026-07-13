import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SELECT_TOOLBAR,
  normalizeSelectToolbar,
  SELECT_TOOLBAR_MAX,
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
    expect(normalizeSelectToolbar('card', ['move'] as unknown as SelectActionId[])).toEqual(
      DEFAULT_SELECT_TOOLBAR.card,
    )
  })
})
