import { describe, expect, it } from 'vitest'
import { DEFAULT_PRIVACY, makePreferences, updatePreferences } from './preferences'

const at = (ms: number) => new Date(ms).toISOString()

describe('makePreferences — extended defaults', () => {
  it('defaults theme to system, language to en, and privacy to DEFAULT_PRIVACY', () => {
    const prefs = makePreferences({ id: 'preferences', createdAt: at(0) })
    expect(prefs.theme).toBe('system')
    expect(prefs.language).toBe('en')
    expect(prefs.privacy).toEqual(DEFAULT_PRIVACY)
  })

  it('still defaults the behaviour switches on', () => {
    const prefs = makePreferences({ id: 'preferences', createdAt: at(0) })
    expect(prefs.soundEffects).toBe(true)
    expect(prefs.notifications).toBe(true)
  })

  it('defaults the daily goal to 5', () => {
    expect(makePreferences({ id: 'preferences', createdAt: at(0) }).dailyGoal).toBe(5)
  })

  it('defaults the study mode to blur and shake-to-undo on', () => {
    const prefs = makePreferences({ id: 'preferences', createdAt: at(0) })
    expect(prefs.studyMode).toBe('blur')
    expect(prefs.shakeToUndo).toBe(true)
  })

  it('clamps a retired study mode (flip) back to the default', () => {
    const prefs = makePreferences({
      id: 'preferences',
      createdAt: at(0),
      studyMode: 'flip' as never,
    })
    expect(prefs.studyMode).toBe('blur')
  })

  it('keeps a still-offered study mode', () => {
    const prefs = makePreferences({ id: 'preferences', createdAt: at(0), studyMode: 'type' })
    expect(prefs.studyMode).toBe('type')
  })

  it('gives each record its own privacy object (no shared mutation)', () => {
    const a = makePreferences({ id: 'a', createdAt: at(0) })
    const b = makePreferences({ id: 'b', createdAt: at(0) })
    expect(a.privacy).not.toBe(b.privacy)
  })
})

describe('DEFAULT_PRIVACY', () => {
  it('matches the ported defaults', () => {
    expect(DEFAULT_PRIVACY).toEqual({
      profileVisibility: true,
      activitySharing: false,
      locationAccess: false,
      notificationTracking: true,
      dataEncryption: true,
    })
  })
})

describe('updatePreferences — nested privacy', () => {
  it('replaces the privacy object and leaves the input untouched', () => {
    const base = makePreferences({ id: 'preferences', createdAt: at(0) })
    const next = updatePreferences(
      base,
      { privacy: { ...base.privacy, activitySharing: true } },
      at(1000),
    )
    expect(next.privacy.activitySharing).toBe(true)
    expect(next.privacy.profileVisibility).toBe(true)
    expect(base.privacy.activitySharing).toBe(false)
  })
})
