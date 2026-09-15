import { describe, expect, it, vi } from 'vitest'
import type { AccountDeletionPort, ScheduledDeletion } from '@/shared/api'
import type { SyncOutcome } from '@/shared/lib'
import { makeDeck } from '@/entities/deck'
import { AT, syncFixture } from '@/features/sync/testing/fake-cloud'
import { syncNow } from '@/features/sync'
import { prepareAccountDeletion } from './prepare-account-deletion'
import { requestAccountDeletion } from './request-account-deletion'
import { cancelAccountDeletion } from './cancel-account-deletion'

const SCHEDULED: ScheduledDeletion = {
  requestedAt: '2026-09-15T00:00:00.000Z',
  purgeAfter: '2026-10-15T00:00:00.000Z',
}

const port = (overrides: Partial<AccountDeletionPort> = {}): AccountDeletionPort => ({
  scheduled: vi.fn().mockResolvedValue(null),
  request: vi.fn().mockResolvedValue(SCHEDULED),
  cancel: vi.fn().mockResolvedValue(undefined),
  ...overrides,
})

function setup(outcome: SyncOutcome = { kind: 'clean' }, online = true) {
  return {
    deletion: port(),
    sync: vi.fn().mockResolvedValue(outcome),
    resetLocalData: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    isOnline: () => online,
  }
}

describe('prepareAccountDeletion', () => {
  it('is blocked offline before any Sync runs', async () => {
    const deps = setup({ kind: 'clean' }, false)
    await expect(prepareAccountDeletion(deps)).resolves.toEqual({ kind: 'offline' })
    expect(deps.sync).not.toHaveBeenCalled()
  })

  it('is ready only once the Sync came back clean or merged', async () => {
    await expect(prepareAccountDeletion(setup({ kind: 'clean' }))).resolves.toEqual({
      kind: 'ready',
    })
    await expect(prepareAccountDeletion(setup({ kind: 'merged' }))).resolves.toEqual({
      kind: 'ready',
    })
  })

  it('names what stood in the way otherwise', async () => {
    await expect(
      prepareAccountDeletion(setup({ kind: 'failed', reason: 'push refused' })),
    ).resolves.toEqual({ kind: 'sync-failed', reason: 'push refused' })
    await expect(
      prepareAccountDeletion(setup({ kind: 'needs-review', items: [] })),
    ).resolves.toEqual({ kind: 'needs-review' })
    await expect(prepareAccountDeletion(setup({ kind: 'offline' }))).resolves.toEqual({
      kind: 'offline',
    })
  })
})

describe('requestAccountDeletion', () => {
  it('synchronises again, then schedules, signs out and wipes — in that order', async () => {
    const deps = setup()
    const order: string[] = []
    deps.sync.mockImplementation(async () => (order.push('sync'), { kind: 'clean' }))
    vi.mocked(deps.deletion.request).mockImplementation(
      async () => (order.push('request'), SCHEDULED),
    )
    deps.signOut.mockImplementation(async () => void order.push('signOut'))
    deps.resetLocalData.mockImplementation(async () => void order.push('reset'))

    await expect(requestAccountDeletion(deps)).resolves.toEqual({
      kind: 'scheduled',
      purgeAfter: SCHEDULED.purgeAfter,
    })
    expect(order).toEqual(['sync', 'request', 'signOut', 'reset'])
  })

  it('stops when the Sync fails — nothing is wiped and nothing is scheduled', async () => {
    const deps = setup({ kind: 'failed', reason: 'push refused' })

    await expect(requestAccountDeletion(deps)).resolves.toEqual({
      kind: 'sync-failed',
      reason: 'push refused',
    })
    expect(deps.deletion.request).not.toHaveBeenCalled()
    expect(deps.resetLocalData).not.toHaveBeenCalled()
  })

  it('stops when the Sync needs an answer about deletions', async () => {
    const deps = setup({ kind: 'needs-review', items: [{ collection: 'decks', id: 'd1' }] })

    await expect(requestAccountDeletion(deps)).resolves.toEqual({ kind: 'needs-review' })
    expect(deps.deletion.request).not.toHaveBeenCalled()
  })

  it('reports a failed request, and wipes nothing', async () => {
    const deps = setup()
    vi.mocked(deps.deletion.request).mockRejectedValue(new Error('function unreachable'))

    await expect(requestAccountDeletion(deps)).resolves.toEqual({
      kind: 'failed',
      reason: 'function unreachable',
    })
    expect(deps.resetLocalData).not.toHaveBeenCalled()
    expect(deps.signOut).not.toHaveBeenCalled()
  })

  it('is blocked offline before the Sync or the request', async () => {
    const deps = setup({ kind: 'clean' }, false)

    await expect(requestAccountDeletion(deps)).resolves.toEqual({ kind: 'offline' })
    expect(deps.sync).not.toHaveBeenCalled()
    expect(deps.deletion.request).not.toHaveBeenCalled()
  })
})

describe('cancelAccountDeletion', () => {
  it('cancels, and the data is back once the restore it started finishes — with no second press', async () => {
    const { deps, cloud, pullEverything } = syncFixture()
    cloud.write('decks', makeDeck({ id: 'd1', createdAt: AT, name: 'Kanji' }))
    cloud.pull = pullEverything
    const deletion = port()

    const { restoring } = await cancelAccountDeletion({ deletion, restore: () => syncNow(deps) })

    expect(deletion.cancel).toHaveBeenCalled()
    await expect(restoring).resolves.toEqual({ kind: 'merged' })
    expect(deps.deckStore.getState().decks.map((row) => row.name)).toEqual(['Kanji'])
  })

  it('hands back before the restore has finished, so the app can open while it runs', async () => {
    let finish: (outcome: SyncOutcome) => void = () => {}
    const restore = vi.fn(
      () =>
        new Promise<SyncOutcome>((resolve) => {
          finish = resolve
        }),
    )

    const { restoring } = await cancelAccountDeletion({ deletion: port(), restore })
    finish({ kind: 'clean' })

    await expect(restoring).resolves.toEqual({ kind: 'clean' })
  })

  it('does not restore when the cancel itself failed', async () => {
    const deletion = port({ cancel: vi.fn().mockRejectedValue(new Error('still scheduled')) })
    const restore = vi.fn()

    await expect(cancelAccountDeletion({ deletion, restore })).rejects.toThrow('still scheduled')
    expect(restore).not.toHaveBeenCalled()
  })
})
