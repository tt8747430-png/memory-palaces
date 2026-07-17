import { describe, expect, it } from 'vitest'
import { bucketOf, relativeTime } from './group'

const NOON = new Date('2026-07-15T12:00:00').getTime()
const iso = (msAgo: number): string => new Date(NOON - msAgo).toISOString()

describe('bucketOf', () => {
  it('buckets the same day as today', () => {
    expect(bucketOf(iso(60_000), NOON)).toBe('today')
  })

  it('buckets the previous calendar day as yesterday', () => {
    expect(bucketOf(new Date('2026-07-14T23:00:00').toISOString(), NOON)).toBe('yesterday')
  })

  it('buckets anything older as earlier', () => {
    expect(bucketOf(new Date('2026-07-12T12:00:00').toISOString(), NOON)).toBe('earlier')
  })
})

describe('relativeTime', () => {
  it('is "now" inside the first minute', () => {
    expect(relativeTime(iso(30_000), NOON)).toEqual({ unit: 'now' })
  })

  it('counts minutes under an hour', () => {
    expect(relativeTime(iso(5 * 60_000), NOON)).toEqual({ unit: 'minutes', value: 5 })
  })

  it('counts hours under a day', () => {
    expect(relativeTime(iso(3 * 3_600_000), NOON)).toEqual({ unit: 'hours', value: 3 })
  })

  it('counts days under a week', () => {
    expect(relativeTime(iso(2 * 86_400_000), NOON)).toEqual({ unit: 'days', value: 2 })
  })

  it('falls back to the date after a week', () => {
    const old = iso(8 * 86_400_000)
    expect(relativeTime(old, NOON)).toEqual({ unit: 'date', iso: old })
  })
})
