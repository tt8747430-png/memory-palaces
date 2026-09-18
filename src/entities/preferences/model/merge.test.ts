import { describe, expect, it } from 'vitest'
import { mergePreferences } from './merge'
import { makePreferences, type Preferences } from './types'

const at = (day: number) => new Date(Date.UTC(2026, 8, day)).toISOString()
const doc = (updatedAt: string, over: Partial<Preferences> = {}): Preferences => ({
  ...makePreferences({ id: 'preferences', createdAt: at(1) }),
  updatedAt,
  ...over,
})

describe('mergePreferences', () => {
  it('keeps each side’s own change — a stale device never undoes another’s setting', () => {
    const lastSeen = doc(at(7))
    const laptop = doc(at(8), { theme: 'dark' })
    const phone = doc(at(9), { devMode: true })

    const merged = mergePreferences(phone, laptop, lastSeen)

    expect(merged.theme).toBe('dark')
    expect(merged.devMode).toBe(true)
  })

  it('lets this device win a setting both changed', () => {
    const lastSeen = doc(at(7))
    const merged = mergePreferences(
      doc(at(9), { dailyGoal: 30 }),
      doc(at(8), { dailyGoal: 50 }),
      lastSeen,
    )
    expect(merged.dailyGoal).toBe(30)
  })

  it('compares nested settings as data, whatever order the server gave their keys', () => {
    const lastSeen = doc(at(7))
    const reordered = JSON.parse(
      JSON.stringify(lastSeen.privacy, Object.keys(lastSeen.privacy).reverse()),
    )
    const merged = mergePreferences(
      doc(at(9), { privacy: reordered }),
      doc(at(8), {
        privacy: { ...lastSeen.privacy, activitySharing: !lastSeen.privacy.activitySharing },
      }),
      lastSeen,
    )
    expect(merged.privacy.activitySharing).toBe(!lastSeen.privacy.activitySharing)
  })

  it('reads a device that never saw the server as having changed only what differs from the defaults', () => {
    const fresh = doc(at(9), { libraryExpanded: ['deck-1'] })
    const server = doc(at(8), { theme: 'dark', dailyGoal: 50 })

    const merged = mergePreferences(fresh, server, undefined)

    expect(merged.theme).toBe('dark')
    expect(merged.dailyGoal).toBe(50)
    expect(merged.libraryExpanded).toEqual(['deck-1'])
  })

  it('stamps the later clock, so the merged document is not refused as older', () => {
    expect(mergePreferences(doc(at(8)), doc(at(9)), doc(at(7))).updatedAt).toBe(at(9))
    expect(mergePreferences(doc(at(9)), doc(at(8)), doc(at(7))).updatedAt).toBe(at(9))
  })
})
