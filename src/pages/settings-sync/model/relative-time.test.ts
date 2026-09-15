import { describe, expect, it } from 'vitest'
import { relativeTime } from './relative-time'

const NOW = Date.parse('2026-09-15T12:00:00.000Z')
const ago = (ms: number) => new Date(NOW - ms).toISOString()

describe('relativeTime', () => {
  it('speaks in the largest unit that still reads as a time', () => {
    expect(relativeTime(ago(20_000), NOW)).toMatch(/second/)
    expect(relativeTime(ago(5 * 60_000), NOW)).toMatch(/5 minutes ago/)
    expect(relativeTime(ago(3 * 3_600_000), NOW)).toMatch(/3 hours ago/)
    expect(relativeTime(ago(2 * 86_400_000), NOW)).toMatch(/2 days ago/)
  })

  it('falls back to a date past a month, where a count of days stops meaning anything', () => {
    expect(relativeTime(ago(40 * 86_400_000), NOW)).not.toMatch(/ago/)
  })

  it('hands back a value it cannot read rather than inventing a time', () => {
    expect(relativeTime('not a date', NOW)).toBe('not a date')
  })
})
