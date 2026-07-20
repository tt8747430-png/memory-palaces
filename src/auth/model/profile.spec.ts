import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PROFILE,
  makeProfile,
  profileHandle,
  profileInitials,
  updateProfile,
} from './profile'

const at = (ms: number) => new Date(ms).toISOString()

describe('makeProfile', () => {
  it('fills defaults and mirrors createdAt into updatedAt', () => {
    const profile = makeProfile({ id: 'profile', createdAt: at(0) })
    expect(profile).toEqual({
      id: 'profile',
      createdAt: at(0),
      updatedAt: at(0),
      ...DEFAULT_PROFILE,
    })
  })

  it('keeps provided fields', () => {
    const profile = makeProfile({ id: 'profile', createdAt: at(0), name: 'Ada', email: 'ada@x.io' })
    expect(profile.name).toBe('Ada')
    expect(profile.email).toBe('ada@x.io')
  })

  it('keeps a provided username and defaults it to empty', () => {
    expect(makeProfile({ id: 'profile', createdAt: at(0) }).username).toBe('')
    expect(makeProfile({ id: 'profile', createdAt: at(0), username: 'ada' }).username).toBe('ada')
  })
})

describe('updateProfile', () => {
  it('applies changes and stamps updatedAt without mutating the input', () => {
    const base = makeProfile({ id: 'profile', createdAt: at(0), name: 'Ada' })
    const next = updateProfile(base, { bio: 'Hello' }, at(1000))
    expect(next.bio).toBe('Hello')
    expect(next.updatedAt).toBe(at(1000))
    expect(base.bio).toBe('')
  })
})

describe('profileInitials', () => {
  it('takes the first letters of the first two name words', () => {
    expect(profileInitials({ name: 'Ada Lovelace', email: '' })).toBe('AL')
  })

  it('falls back to the first two letters of a single name', () => {
    expect(profileInitials({ name: 'Grace', email: '' })).toBe('GR')
  })

  it('uses the email when the name is empty', () => {
    expect(profileInitials({ name: '', email: 'neo@matrix.io' })).toBe('NE')
  })

  it('is empty when there is nothing to derive from', () => {
    expect(profileInitials({ name: '', email: '' })).toBe('')
  })
})

describe('profileHandle', () => {
  it('prefers the chosen username, slugified', () => {
    expect(
      profileHandle({
        name: 'Ada Lovelace',
        email: 'ada.lovelace@x.io',
        username: 'Ada_Lovelace99',
      }),
    ).toBe('adalovelace99')
  })

  it('derives from the email local part when there is no username', () => {
    expect(profileHandle({ name: 'Ada Lovelace', email: 'ada.lovelace@x.io', username: '' })).toBe(
      'adalovelace',
    )
  })

  it('falls back to the slugified name', () => {
    expect(profileHandle({ name: 'Grace Hopper', email: '', username: '' })).toBe('gracehopper')
  })
})
