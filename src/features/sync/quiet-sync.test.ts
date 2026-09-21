import { describe, expect, it } from 'vitest'
import { makeDeck } from '@/entities/deck'
import { makePendingChange } from '@/entities/pending-change'
import { selectPendingChanges } from '@/entities/pending-change'
import { selectSyncState } from '@/entities/sync-state'
import { AT, NOW, syncFixture } from './testing/fake-cloud'
import { quietSync } from './quiet-sync'
import { syncNow } from './sync-now'

const deck = (id: string) => makeDeck({ id, createdAt: AT, name: id })

const waiting = (deps: ReturnType<typeof syncFixture>['deps']) =>
  selectPendingChanges(deps.pendingChangeStore.getState()).map((change) => change.id)

const state = (deps: ReturnType<typeof syncFixture>['deps']) =>
  selectSyncState(deps.syncStateStore.getState())

/** A change on a quiet table, written straight to the log the way its store's port would. */
const quietChange = (deps: ReturnType<typeof syncFixture>['deps'], table = 'preferences') =>
  deps.pendingChangeStore
    .getState()
    .save(makePendingChange({ table, entityId: 'p1', op: 'save', at: AT }))

describe('quietSync', () => {
  it('carries the quiet tables and nothing else', async () => {
    const { deps, cloud } = syncFixture()

    await quietSync(deps)

    expect(cloud.scopes).toEqual([deps.quiet])
    expect(cloud.scopes.flat()).not.toContain('cards')
  })

  it('clears the quiet changes it confirmed', async () => {
    const { deps } = syncFixture()
    await quietChange(deps)

    await expect(quietSync(deps)).resolves.toEqual({ kind: 'clean' })
    expect(waiting(deps)).toEqual([])
  })

  it('leaves the held changes alone — they are not its business', async () => {
    const { deps } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await quietChange(deps)

    await quietSync(deps)

    expect(waiting(deps)).toEqual(['decks:d1'])
  })

  it('writes no line in the Sync log and does not move the last-synchronised date', async () => {
    const { deps } = syncFixture()
    await quietChange(deps)

    await quietSync(deps)

    expect(state(deps).log).toEqual([])
    expect(state(deps).lastSyncedAt).toBeNull()
  })

  it('never says the cloud is ahead: a setting changed elsewhere is this cycle to answer', async () => {
    const { deps } = syncFixture()
    cloudMovedQuietly(deps)

    await expect(quietSync(deps)).resolves.toEqual({ kind: 'merged' })
    expect(state(deps).cloudChanged).toBe(false)
  })

  it('reports offline without touching the log', async () => {
    const { deps, cloud } = syncFixture()
    deps.isOnline = () => false
    await quietChange(deps)

    await expect(quietSync(deps)).resolves.toEqual({ kind: 'offline' })
    expect(cloud.cycles).toBe(0)
    expect(waiting(deps)).toEqual(['preferences:p1'])
  })

  it('keeps a quiet change whose cycle failed, and says nothing about it', async () => {
    const { deps, cloud } = syncFixture()
    await quietChange(deps)
    cloud.failNextCycle('offline while pushing')

    await expect(quietSync(deps)).resolves.toMatchObject({ kind: 'failed' })
    expect(waiting(deps)).toEqual(['preferences:p1'])
    expect(state(deps).log).toEqual([])
  })

  it('does not lose a checkpoint a Sync wrote while it ran', async () => {
    const { deps, cloud } = syncFixture()
    cloud.write('decks', deck('remote'))
    await syncNow(deps)
    const afterSync = state(deps).checkpoints.decks

    await quietSync(deps)

    expect(state(deps).checkpoints.decks).toEqual(afterSync)
  })
})

/** Another device changed a setting: a quiet row lands in the cloud ahead of this device. */
function cloudMovedQuietly(deps: ReturnType<typeof syncFixture>['deps']): void {
  deps.cloud.peek = async (table) =>
    table === 'preferences' ? [{ id: 'p1', updated_at: NOW, deleted: false }] : []
}
