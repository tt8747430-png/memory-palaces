import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { FlashcardSwipeByMode } from '@/shared/config/flashcard-swipe'
import { DEFAULT_FLASHCARD_SWIPE } from '@/shared/config/flashcard-swipe'
import { useStudySettings } from './use-study-settings'
import type { StudyPrefs } from './types'

afterEach(cleanup)

const prefs: StudyPrefs = {
  direction: 'front',
  shuffle: false,
  textToSpeech: false,
  newCardsPerDay: 10,
  maxCardsPerDay: 3000,
}
const swipeByMode = {
  blur: DEFAULT_FLASHCARD_SWIPE,
  words: DEFAULT_FLASHCARD_SWIPE,
  initials: DEFAULT_FLASHCARD_SWIPE,
  type: DEFAULT_FLASHCARD_SWIPE,
} as FlashcardSwipeByMode

function setup(overrides: Partial<Parameters<typeof useStudySettings>[0]> = {}) {
  const args = {
    mode: 'blur' as const,
    prefs,
    onPrefsChange: vi.fn(),
    wordSpaces: false,
    onWordSpacesChange: vi.fn(),
    shakeToUndo: false,
    onShakeToUndoChange: vi.fn(),
    swipeByMode,
    onSwipeByModeChange: vi.fn(),
    filter: { kind: 'all' } as const,
    filterCounts: { all: 4, due: 2, new: 1, learning: 1, flagged: 0 },
    onFilterChange: vi.fn(),
    ...overrides,
  }
  return { ...renderHook(() => useStudySettings(args)), args }
}

describe('useStudySettings', () => {
  it('presents every setting as one flat value, wherever each is stored', () => {
    const { result } = setup()
    expect(result.current.value).toEqual({
      direction: 'front',
      shuffle: false,
      textToSpeech: false,
      wordSpaces: false,
      typeInitialsOnly: false,
      shakeToUndo: false,
      swipe: DEFAULT_FLASHCARD_SWIPE,
      filter: { kind: 'all' },
    })
  })

  it('routes a Deck setting back through the whole prefs object', () => {
    const { result, args } = setup()
    act(() => result.current.set('shuffle', true))
    expect(args.onPrefsChange).toHaveBeenCalledWith({ ...prefs, shuffle: true })
  })

  it('routes a global Preference to its own channel, not the Deck', () => {
    const { result, args } = setup()
    act(() => result.current.set('wordSpaces', true))
    expect(args.onWordSpacesChange).toHaveBeenCalledWith(true)
    expect(args.onPrefsChange).not.toHaveBeenCalled()
  })

  it('keeps a session-only setting itself', () => {
    const { result, args } = setup()
    act(() => result.current.set('typeInitialsOnly', true))
    expect(result.current.value.typeInitialsOnly).toBe(true)
    expect(args.onPrefsChange).not.toHaveBeenCalled()
    expect(args.onWordSpacesChange).not.toHaveBeenCalled()
  })

  it('changing the Study filter goes back to the session, which rebuilds the queue', () => {
    const { result, args } = setup()
    act(() => result.current.set('filter', { kind: 'due' }))
    expect(args.onFilterChange).toHaveBeenCalledWith({ kind: 'due' })
  })

  it('shows only the current mode’s swipe map, and writes back only that mode', () => {
    const { result, args } = setup({ mode: 'type' })
    act(() => result.current.setSwipe('up', 'skip'))
    expect(args.onSwipeByModeChange).toHaveBeenCalledWith({
      ...swipeByMode,
      type: { ...DEFAULT_FLASHCARD_SWIPE, up: 'skip' },
    })
  })
})
