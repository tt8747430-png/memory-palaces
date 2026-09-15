import { describe, expect, it } from 'vitest'
import { DEFAULT_DECK_SETTINGS, makeDeck } from '@/entities/deck'
import { DEFAULT_FLASHCARD_SWIPE_BY_MODE } from '@/shared/config/flashcard-swipe'
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
      flashcardSwipe: DEFAULT_FLASHCARD_SWIPE_BY_MODE,
    })
    expect(prefs).toEqual({
      wordSpaces: false,
      typeInitialsOnly: true,
      shakeToUndo: false,
      swipeByMode: DEFAULT_FLASHCARD_SWIPE_BY_MODE,
    })
  })

  it('completes a swipe map stored before a mode existed', () => {
    const prefs = learnerStudyPrefs({
      studyWordSpaces: true,
      studyTypeInitialsOnly: false,
      shakeToUndo: true,
      flashcardSwipe: { blur: DEFAULT_FLASHCARD_SWIPE_BY_MODE.blur } as never,
    })
    expect(Object.keys(prefs.swipeByMode).sort()).toEqual(['blur', 'initials', 'type', 'words'])
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
        swipeByMode: DEFAULT_FLASHCARD_SWIPE_BY_MODE,
      }),
    ).toEqual({
      studyWordSpaces: false,
      shakeToUndo: false,
      flashcardSwipe: DEFAULT_FLASHCARD_SWIPE_BY_MODE,
    })
  })

  it('writes nothing for an empty change', () => {
    expect(learnerStudyPrefsPatch({})).toEqual({})
  })
})
