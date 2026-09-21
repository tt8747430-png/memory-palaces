import { describe, expect, it } from 'vitest'
import {
  actionsFor,
  DEFAULT_FLASHCARD_SWIPE,
  isFastAction,
  isGradeAction,
  normalizeFlashcardSwipe,
} from './flashcard-swipe'

describe('actionsFor', () => {
  it('offers the four Grades under Spaced repetition, and neither Fast review answer', () => {
    const actions = actionsFor('spaced', 'blur')
    expect(actions).toEqual(
      expect.arrayContaining(['again', 'hard', 'good', 'easy', 'flag', 'skip', 'none']),
    )
    expect(actions).not.toContain('gotIt')
    expect(actions).not.toContain('notQuite')
  })

  it('offers the two Fast review answers under Fast review, and no Grade', () => {
    const actions = actionsFor('fast', 'blur')
    expect(actions).toEqual(expect.arrayContaining(['gotIt', 'notQuite', 'flag', 'skip', 'none']))
    expect(actions.filter(isGradeAction)).toEqual([])
  })

  it('adds the display mode’s own actions, whatever the algorithm', () => {
    expect(actionsFor('fast', 'type')).toEqual(expect.arrayContaining(['nextWord', 'reset']))
    expect(actionsFor('spaced', 'initials')).toContain('showWords')
    expect(actionsFor('spaced', 'blur')).not.toContain('nextWord')
  })
})

describe('defaults', () => {
  it('sends a fling each way to the answer its algorithm can honour', () => {
    expect(DEFAULT_FLASHCARD_SWIPE.spaced.right).toBe('good')
    expect(DEFAULT_FLASHCARD_SWIPE.fast.right).toBe('gotIt')
    expect(isGradeAction(DEFAULT_FLASHCARD_SWIPE.spaced.left)).toBe(true)
    expect(isFastAction(DEFAULT_FLASHCARD_SWIPE.fast.left)).toBe(true)
  })
})

describe('normalizeFlashcardSwipe', () => {
  it('starts from the defaults when nothing is stored', () => {
    expect(normalizeFlashcardSwipe()).toEqual({
      spaced: expect.objectContaining({ blur: DEFAULT_FLASHCARD_SWIPE.spaced }),
      fast: expect.objectContaining({ blur: DEFAULT_FLASHCARD_SWIPE.fast }),
    })
  })

  it('reads the shape it stores now', () => {
    const stored = {
      spaced: { blur: { ...DEFAULT_FLASHCARD_SWIPE.spaced, up: 'skip' } },
      fast: { type: { ...DEFAULT_FLASHCARD_SWIPE.fast, up: 'nextWord' } },
    }
    const read = normalizeFlashcardSwipe(stored)
    expect(read.spaced.blur.up).toBe('skip')
    expect(read.fast.type.up).toBe('nextWord')
    // The modes it said nothing about keep their own algorithm's defaults.
    expect(read.spaced.words).toEqual(DEFAULT_FLASHCARD_SWIPE.spaced)
    expect(read.fast.blur).toEqual(DEFAULT_FLASHCARD_SWIPE.fast)
  })

  it('reads a map stored per display mode as the Spaced repetition one', () => {
    const read = normalizeFlashcardSwipe({
      blur: { up: 'flag', down: 'skip', left: 'again', right: 'easy' },
      words: { up: 'flag', down: 'skip', left: 'again', right: 'hard' },
    })
    expect(read.spaced.blur.right).toBe('easy')
    expect(read.spaced.words.right).toBe('hard')
    expect(read.fast.blur).toEqual(DEFAULT_FLASHCARD_SWIPE.fast)
  })

  it('reads the oldest flat map into every Spaced repetition mode', () => {
    const read = normalizeFlashcardSwipe({ up: 'skip', down: 'flag', left: 'hard', right: 'easy' })
    expect(read.spaced.blur).toEqual({ up: 'skip', down: 'flag', left: 'hard', right: 'easy' })
    expect(read.spaced.type.right).toBe('easy')
    expect(read.fast.type).toEqual(DEFAULT_FLASHCARD_SWIPE.fast)
  })

  it('refuses an action the algorithm cannot honour, and falls back to its default', () => {
    const read = normalizeFlashcardSwipe({
      fast: { blur: { up: 'flag', down: 'skip', left: 'again', right: 'good' } },
    })
    expect(read.fast.blur.left).toBe(DEFAULT_FLASHCARD_SWIPE.fast.left)
    expect(read.fast.blur.right).toBe(DEFAULT_FLASHCARD_SWIPE.fast.right)
  })

  it('refuses an action the display mode does not have', () => {
    const read = normalizeFlashcardSwipe({
      spaced: { blur: { up: 'nextWord', down: 'skip', left: 'again', right: 'good' } },
    })
    expect(read.spaced.blur.up).toBe(DEFAULT_FLASHCARD_SWIPE.spaced.up)
  })

  it('shrugs off anything that is not a map at all', () => {
    expect(normalizeFlashcardSwipe('nonsense')).toEqual(normalizeFlashcardSwipe())
    expect(normalizeFlashcardSwipe(null)).toEqual(normalizeFlashcardSwipe())
  })
})
