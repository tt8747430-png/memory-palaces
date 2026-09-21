import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { DEFAULT_CARD_STYLE } from '@/entities/deck'
import type { FlashcardSwipePreferences } from '@/shared/config/flashcard-swipe'
import { DEFAULT_FLASHCARD_SWIPE_PREFERENCES } from '@/shared/config/flashcard-swipe'
import { useStudySettings } from './use-study-settings'
import type { DeckStudyPrefs, LearnerStudyPrefs } from './types'

afterEach(cleanup)

const deckPrefs: DeckStudyPrefs = {
  direction: 'front',
  shuffle: false,
  textToSpeech: false,
  newCardsPerDay: 10,
  maxCardsPerDay: 3000,
  cardStyle: DEFAULT_CARD_STYLE,
}
const swipePreferences: FlashcardSwipePreferences = DEFAULT_FLASHCARD_SWIPE_PREFERENCES
const spaced = DEFAULT_FLASHCARD_SWIPE_PREFERENCES.spaced

const learnerPrefs: LearnerStudyPrefs = {
  wordSpaces: false,
  typeInitialsOnly: false,
  shakeToUndo: false,
  swipePreferences,
}

function setup(overrides: Partial<Parameters<typeof useStudySettings>[0]> = {}) {
  const args = {
    mode: 'blur' as const,
    algorithm: 'spaced' as const,
    deckPrefs,
    onDeckPrefsChange: vi.fn(),
    learnerPrefs,
    onLearnerPrefsChange: vi.fn(),
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
      swipe: spaced.blur,
      filter: { kind: 'all' },
    })
  })

  it('routes a Deck setting back through the whole prefs object', () => {
    const { result, args } = setup()
    act(() => result.current.set('shuffle', true))
    expect(args.onDeckPrefsChange).toHaveBeenCalledWith({ ...deckPrefs, shuffle: true })
  })

  it('routes a learner’s own setting to its own channel, as a patch of just that key', () => {
    const { result, args } = setup()
    act(() => result.current.set('wordSpaces', true))
    expect(args.onLearnerPrefsChange).toHaveBeenCalledWith({ wordSpaces: true })
    expect(args.onDeckPrefsChange).not.toHaveBeenCalled()
  })

  it('routes the Type mode recall toggle the same way — it outlives the session', () => {
    const { result, args } = setup()
    act(() => result.current.set('typeInitialsOnly', true))
    expect(args.onLearnerPrefsChange).toHaveBeenCalledWith({ typeInitialsOnly: true })
    expect(args.onDeckPrefsChange).not.toHaveBeenCalled()
  })

  it('shows the stored recall toggle rather than a default of its own', () => {
    const { result } = setup({ learnerPrefs: { ...learnerPrefs, typeInitialsOnly: true } })
    expect(result.current.value.typeInitialsOnly).toBe(true)
  })

  it('refuses a Deck setting the deck does not own, and writes nothing', () => {
    const { result, args } = setup({ lockedPrefs: ['shuffle'] })
    act(() => result.current.set('shuffle', true))
    expect(args.onDeckPrefsChange).not.toHaveBeenCalled()
  })

  it('changing the Study filter goes back to the session, which rebuilds the queue', () => {
    const { result, args } = setup()
    act(() => result.current.set('filter', { kind: 'due' }))
    expect(args.onFilterChange).toHaveBeenCalledWith({ kind: 'due' })
  })

  it('shows only the current mode’s swipe map, and writes back only that mode', () => {
    const { result, args } = setup({ mode: 'type' })
    act(() => result.current.setSwipe('up', 'skip'))
    expect(args.onLearnerPrefsChange).toHaveBeenCalledWith({
      swipePreferences: {
        ...swipePreferences,
        spaced: { ...spaced, type: { ...spaced.type, up: 'skip' } },
      },
    })
  })

  it('carries the other modes’ swipe maps through untouched when one mode is set whole', () => {
    const { result, args } = setup({ mode: 'blur' })
    act(() => result.current.set('swipe', { ...spaced.blur, down: 'flag' }))
    expect(args.onLearnerPrefsChange).toHaveBeenCalledWith({
      swipePreferences: {
        ...swipePreferences,
        spaced: { ...spaced, blur: { ...spaced.blur, down: 'flag' } },
      },
    })
  })

  it('keeps the two algorithms apart: a Fast review swipe never touches the Spaced one', () => {
    const { result, args } = setup({ mode: 'blur', algorithm: 'fast' })
    expect(result.current.value.swipe.right).toBe('gotIt')

    act(() => result.current.setSwipe('right', 'notQuite'))
    expect(args.onLearnerPrefsChange).toHaveBeenCalledWith({
      swipePreferences: {
        ...swipePreferences,
        fast: {
          ...swipePreferences.fast,
          blur: { ...swipePreferences.fast.blur, right: 'notQuite' },
        },
      },
    })
  })
})
