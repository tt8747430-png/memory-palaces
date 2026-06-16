import { describe, expect, it } from 'vitest'
import { bucketOf, relativeTime } from './group'

const DAY = 86_400_000
const NOW = Date.UTC(2026, 5, 16, 12, 0, 0)
const iso = (ms: number) => new Date(ms).toISOString()

describe('bucketOf', () => {
  it('buckets same-day timestamps as today', () => {
    expect(bucketOf(iso(NOW - 3_600_000), NOW)).toBe('today')
  })

  it('buckets the previous day as yesterday', () => {
    expect(bucketOf(iso(NOW - DAY), NOW)).toBe('yesterday')
  })

  it('buckets older timestamps as earlier', () => {
    expect(bucketOf(iso(NOW - 5 * DAY), NOW)).toBe('earlier')
  })
})

describe('relativeTime', () => {
  it('reads under a minute as "now"', () => {
    expect(relativeTime(iso(NOW - 30_000), NOW)).toEqual({ unit: 'now' })
  })

  it('reads minutes and hours', () => {
    expect(relativeTime(iso(NOW - 5 * 60_000), NOW)).toEqual({ unit: 'minutes', value: 5 })
    expect(relativeTime(iso(NOW - 3 * 3_600_000), NOW)).toEqual({ unit: 'hours', value: 3 })
  })

  it('reads days within the past week', () => {
    expect(relativeTime(iso(NOW - 2 * DAY), NOW)).toEqual({ unit: 'days', value: 2 })
  })

  it('falls back to an absolute date beyond a week', () => {
    const old = iso(NOW - 10 * DAY)
    expect(relativeTime(old, NOW)).toEqual({ unit: 'date', iso: old })
  })
})
