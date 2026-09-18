import { describe, expect, it } from 'vitest'
import { syncStatus } from './status'

describe('syncStatus', () => {
  it.each([
    [{ phase: 'syncing', waiting: 3, online: true }, 'syncing'],
    [{ phase: 'restoring', waiting: 0, online: false }, 'syncing'],
    [{ phase: 'failed', waiting: 3, online: true }, 'failed'],
    [{ phase: 'idle', waiting: 3, online: false }, 'offline'],
    [{ phase: 'idle', waiting: 3, online: true }, 'waiting'],
    [{ phase: 'synced', waiting: 0, online: true }, 'synced'],
    [{ phase: 'idle', waiting: 0, online: true }, 'synced'],
  ] as const)('%j → %s', (input, status) => {
    expect(syncStatus(input)).toBe(status)
  })
})
