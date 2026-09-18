import { describe, expect, it } from 'vitest'
import {
  completePreferences,
  DEFAULT_PRIVACY,
  isExtensionEnabled,
  makePreferences,
  updatePreferences,
} from './types'

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

  it('defaults Type mode to typing the answer out, not its initials', () => {
    expect(makePreferences({ id: 'preferences', createdAt: at(0) }).studyTypeInitialsOnly).toBe(
      false,
    )
  })

  it('keeps a stored initials-only choice', () => {
    const prefs = makePreferences({
      id: 'preferences',
      createdAt: at(0),
      studyTypeInitialsOnly: true,
    })
    expect(prefs.studyTypeInitialsOnly).toBe(true)
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
      dataEncryption: false,
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

describe('extensions', () => {
  it('defaults to none enabled', () => {
    const prefs = makePreferences({ id: 'preferences', createdAt: at(0) })
    expect(prefs.extensions).toEqual([])
  })

  it('keeps ids this build has never heard of — an older build must not switch them off', () => {
    const stored = {
      ...makePreferences({ id: 'preferences', createdAt: at(0) }),
      extensions: ['bible', 'something-from-the-future'],
    }
    expect(completePreferences(stored).extensions).toEqual(['bible', 'something-from-the-future'])
  })

  it('reports whether one extension is on', () => {
    const prefs = {
      ...makePreferences({ id: 'preferences', createdAt: at(0) }),
      extensions: ['bible'],
    }
    expect(isExtensionEnabled(prefs, 'bible')).toBe(true)
    expect(isExtensionEnabled(prefs, 'atlas')).toBe(false)
  })
})

describe('settings that used to live on the device', () => {
  it('defaults dev mode off, Autosync on, and no Library row expanded', () => {
    const prefs = makePreferences({ id: 'preferences', createdAt: at(0) })
    expect(prefs.devMode).toBe(false)
    expect(prefs.autosync).toBe(true)
    expect(prefs.libraryExpanded).toEqual([])
  })

  it('completes a row an older build pushed without them', () => {
    const older: Record<string, unknown> = {
      ...makePreferences({ id: 'preferences', createdAt: at(0) }),
    }
    for (const field of ['devMode', 'autosync', 'libraryExpanded']) delete older[field]
    const completed = completePreferences(older as never)
    expect(completed.devMode).toBe(false)
    expect(completed.autosync).toBe(true)
    expect(completed.libraryExpanded).toEqual([])
  })

  it('keeps what was stored', () => {
    const stored = {
      ...makePreferences({ id: 'preferences', createdAt: at(0) }),
      devMode: true,
      autosync: false,
      libraryExpanded: ['deck-1'],
    }
    const completed = completePreferences(stored)
    expect(completed.devMode).toBe(true)
    expect(completed.autosync).toBe(false)
    expect(completed.libraryExpanded).toEqual(['deck-1'])
  })
})
