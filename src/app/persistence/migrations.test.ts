import { describe, expect, it } from 'vitest'
import { DEFAULT_PRIVACY } from '@/entities/preferences'
import { migratePreferencesV1, type PreferencesV0 } from './migrations'

const v0: PreferencesV0 = {
  id: 'preferences',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  soundEffects: false,
  haptics: false,
  reducedMotion: true,
  notifications: false,
}

describe('migratePreferencesV1', () => {
  it('backfills darkMode, language, and privacy on a v0 record', () => {
    const v1 = migratePreferencesV1(v0)
    expect(v1.darkMode).toBe(false)
    expect(v1.language).toBe('en')
    expect(v1.privacy).toEqual(DEFAULT_PRIVACY)
  })

  it('keeps the saved v0 values (defaults never override them)', () => {
    const v1 = migratePreferencesV1(v0)
    expect(v1.soundEffects).toBe(false)
    expect(v1.haptics).toBe(false)
    expect(v1.notifications).toBe(false)
    expect(v1.id).toBe('preferences')
    expect(v1.updatedAt).toBe('2026-01-02T00:00:00.000Z')
  })
})
