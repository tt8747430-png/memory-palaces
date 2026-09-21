import { describe, expect, it } from 'vitest'
import { DEFAULT_DECK_SETTINGS, makeDeck } from '@/entities/deck'
import { DEFAULT_FLASHCARD_SWIPE_PREFERENCES } from '@/shared/config/flashcard-swipe'
import {
  deckStudyPrefs,
  deckStudyPrefsPatch,
  learnerStudyPrefs,
  learnerStudyPrefsPatch,
  lockedDeckPrefs,
} from './study-prefs'

const createdAt = new Date(0).toISOString()

describe('lockedDeckPrefs', () => {
  it('locks shuffle in a subdeck’s study session — its main deck owns it', () => {
    const sub = makeDeck({ id: 'sub', createdAt, name: 'Physics', parentId: 'main' })
    expect(lockedDeckPrefs(sub)).toEqual(['shuffle'])
  })

  it('locks nothing for a main deck', () => {
    expect(lockedDeckPrefs(makeDeck({ id: 'main', createdAt, name: 'Science' }))).toEqual([])
  })
})

describe('deckStudyPrefsPatch', () => {
  it('carries only the setting the change moved', () => {
    const current = deckStudyPrefs(DEFAULT_DECK_SETTINGS)

    expect(deckStudyPrefsPatch(current, { ...current, direction: 'back' })).toEqual({
      studyDirection: 'back',
    })
    expect(deckStudyPrefsPatch(current, current)).toEqual({})
  })

  it('writes each pref to the very setting it is read back from', () => {
    const current = deckStudyPrefs(DEFAULT_DECK_SETTINGS)
    const next = {
      ...current,
      direction: 'back' as const,
      shuffle: !current.shuffle,
      textToSpeech: !current.textToSpeech,
    }

    const patched = { ...DEFAULT_DECK_SETTINGS, ...deckStudyPrefsPatch(current, next) }

    expect(deckStudyPrefs(patched)).toEqual(next)
  })
})

describe('learnerStudyPrefs', () => {
  it('reads the session’s names off the keys they are stored under', () => {
    const prefs = learnerStudyPrefs({
      studyWordSpaces: false,
      studyTypeInitialsOnly: true,
      shakeToUndo: false,
      flashcardSwipe: DEFAULT_FLASHCARD_SWIPE_PREFERENCES,
    })
    expect(prefs).toEqual({
      wordSpaces: false,
      typeInitialsOnly: true,
      shakeToUndo: false,
      swipePreferences: DEFAULT_FLASHCARD_SWIPE_PREFERENCES,
    })
  })

  it('completes a swipe map stored before a mode existed', () => {
    const prefs = learnerStudyPrefs({
      studyWordSpaces: true,
      studyTypeInitialsOnly: false,
      shakeToUndo: true,
      flashcardSwipe: { blur: DEFAULT_FLASHCARD_SWIPE_PREFERENCES.spaced.blur } as never,
    })
    expect(Object.keys(prefs.swipePreferences).sort()).toEqual(['fast', 'spaced'])
    expect(Object.keys(prefs.swipePreferences.spaced).sort()).toEqual([
      'blur',
      'initials',
      'type',
      'words',
    ])
  })

  it('reads a map stored before Fast review had answers of its own as the Spaced one', () => {
    const prefs = learnerStudyPrefs({
      studyWordSpaces: true,
      studyTypeInitialsOnly: false,
      shakeToUndo: true,
      flashcardSwipe: { up: 'flag', down: 'skip', left: 'again', right: 'easy' } as never,
    })
    expect(prefs.swipePreferences.spaced.blur.right).toBe('easy')
    expect(prefs.swipePreferences.fast.blur.right).toBe('gotIt')
  })
})

describe('learnerStudyPrefsPatch', () => {
  it('carries only the pref the change moved, under its stored key', () => {
    expect(learnerStudyPrefsPatch({ typeInitialsOnly: true })).toEqual({
      studyTypeInitialsOnly: true,
    })
  })

  it('renames every learner pref the session can change', () => {
    expect(
      learnerStudyPrefsPatch({
        wordSpaces: false,
        shakeToUndo: false,
        swipePreferences: DEFAULT_FLASHCARD_SWIPE_PREFERENCES,
      }),
    ).toEqual({
      studyWordSpaces: false,
      shakeToUndo: false,
      flashcardSwipe: DEFAULT_FLASHCARD_SWIPE_PREFERENCES,
    })
  })

  it('writes nothing for an empty change', () => {
    expect(learnerStudyPrefsPatch({})).toEqual({})
  })
})
