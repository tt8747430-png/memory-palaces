import { describe, expect, it } from 'vitest'
import { DEFAULT_PRIVACY } from '@/entities/preferences'
import {
  migratePreferencesV1,
  migratePreferencesV2,
  migrateProfileV1,
  type PreferencesV0,
  type PreferencesV1,
  type ProfileV0,
} from './migrations'

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

describe('migratePreferencesV2', () => {
  const v1: PreferencesV1 = {
    id: 'preferences',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
    soundEffects: false,
    haptics: true,
    reducedMotion: false,
    notifications: true,
    darkMode: true,
    language: 'en',
    privacy: DEFAULT_PRIVACY,
  }

  it('backfills palacesView and palacesSort with defaults on a v1 record', () => {
    const v2 = migratePreferencesV2(v1)
    expect(v2.palacesView).toBe('grid')
    expect(v2.palacesSort).toBe('recent')
  })

  it('keeps the saved v1 values (defaults never override them)', () => {
    const v2 = migratePreferencesV2(v1)
    expect(v2.darkMode).toBe(true)
    expect(v2.soundEffects).toBe(false)
    expect(v2.updatedAt).toBe('2026-01-03T00:00:00.000Z')
  })

  it('composes after v0 → v1 so a v0 record reaches a complete v2 shape', () => {
    const v2 = migratePreferencesV2(migratePreferencesV1(v0))
    expect(v2.palacesView).toBe('grid')
    expect(v2.palacesSort).toBe('recent')
    expect(v2.darkMode).toBe(false)
    expect(v2.soundEffects).toBe(false)
  })
})

describe('migrateProfileV1', () => {
  const v0Profile: ProfileV0 = {
    id: 'profile',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    name: 'Ada',
    email: 'ada@x.io',
    bio: '',
    avatar: null,
  }

  it('backfills an empty username and keeps the saved fields', () => {
    const v1 = migrateProfileV1(v0Profile)
    expect(v1.username).toBe('')
    expect(v1.name).toBe('Ada')
    expect(v1.email).toBe('ada@x.io')
    expect(v1.updatedAt).toBe('2026-01-02T00:00:00.000Z')
  })
})
