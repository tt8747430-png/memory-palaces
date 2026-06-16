import { describe, expect, it } from 'vitest'
import { DEFAULT_PRIVACY, makePreferences, updatePreferences } from './types'

const at = (ms: number) => new Date(ms).toISOString()

describe('makePreferences — extended defaults', () => {
  it('defaults darkMode off, language to en, and privacy to DEFAULT_PRIVACY', () => {
    const prefs = makePreferences({ id: 'preferences', createdAt: at(0) })
    expect(prefs.darkMode).toBe(false)
    expect(prefs.language).toBe('en')
    expect(prefs.privacy).toEqual(DEFAULT_PRIVACY)
  })

  it('still defaults the behaviour switches on', () => {
    const prefs = makePreferences({ id: 'preferences', createdAt: at(0) })
    expect(prefs.soundEffects).toBe(true)
    expect(prefs.notifications).toBe(true)
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
