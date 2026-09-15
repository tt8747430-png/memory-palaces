import { describe, expect, it } from 'vitest'
import { daysFrom, longDate } from './long-date'

describe('longDate', () => {
  it('writes the day, the month in words and the year', () => {
    expect(longDate('2026-10-15T12:00:00.000Z', 'en-GB')).toBe('15 October 2026')
    expect(longDate('2026-10-15T12:00:00.000Z', 'en-US')).toBe('October 15, 2026')
  })
})

describe('daysFrom', () => {
  it('counts whole days forward', () => {
    expect(daysFrom(Date.parse('2026-09-15T00:00:00.000Z'), 30)).toBe('2026-10-15T00:00:00.000Z')
  })
})
