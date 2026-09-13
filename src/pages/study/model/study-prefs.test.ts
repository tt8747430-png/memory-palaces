import { describe, expect, it } from 'vitest'
import { DEFAULT_DECK_SETTINGS, makeDeck } from '@/entities/deck'
import { lockedStudyPrefs, studyPrefsFromSettings, studyPrefsPatch } from './study-prefs'

const createdAt = new Date(0).toISOString()

describe('lockedStudyPrefs', () => {
  it('locks shuffle in a subdeck’s study session — its main deck owns it', () => {
    const sub = makeDeck({ id: 'sub', createdAt, name: 'Physics', parentId: 'main' })
    expect(lockedStudyPrefs(sub)).toEqual(['shuffle'])
  })

  it('locks nothing for a main deck', () => {
    expect(lockedStudyPrefs(makeDeck({ id: 'main', createdAt, name: 'Science' }))).toEqual([])
  })
})

describe('studyPrefsPatch', () => {
  it('carries only the setting the change moved', () => {
    const current = studyPrefsFromSettings(DEFAULT_DECK_SETTINGS)

    expect(studyPrefsPatch(current, { ...current, direction: 'back' })).toEqual({
      studyDirection: 'back',
    })
    expect(studyPrefsPatch(current, current)).toEqual({})
  })

  it('writes each pref to the very setting it is read back from', () => {
    const current = studyPrefsFromSettings(DEFAULT_DECK_SETTINGS)
    const next = {
      ...current,
      direction: 'back' as const,
      shuffle: !current.shuffle,
      textToSpeech: !current.textToSpeech,
    }

    const patched = { ...DEFAULT_DECK_SETTINGS, ...studyPrefsPatch(current, next) }

    expect(studyPrefsFromSettings(patched)).toEqual(next)
  })
})
