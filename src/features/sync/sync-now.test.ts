import { describe, expect, it } from 'vitest'
import { makeCard } from '@/entities/card'
import { makeDeck } from '@/entities/deck'
import { makeFolder } from '@/entities/folder'
import { makeQuestion } from '@/entities/question'
import { makePendingChange, selectPendingChanges } from '@/entities/pending-change'
import { selectSyncState } from '@/entities/sync-state'
import { AT, NOW, syncFixture } from './testing/fake-cloud'
import { repairSync, syncNow } from './sync-now'

const deck = (id: string, extra: { parentId?: string; folderId?: string } = {}) =>
  makeDeck({ id, createdAt: AT, name: id, ...extra })
const folder = (id: string) => makeFolder({ id, createdAt: AT, name: id, color: 'sky', icon: '📁' })
const card = (id: string, deckId: string) =>
  makeCard({ id, createdAt: AT, deckId, front: id, back: id })
const question = (id: string, deckId: string) =>
  makeQuestion({ id, createdAt: AT, deckId, prompt: id, options: ['a', 'b'], correctAnswer: 0 })

const state = (deps: ReturnType<typeof syncFixture>['deps']) =>
  selectSyncState(deps.syncStateStore.getState())

describe('syncNow', () => {
  it('carries the held tables, and leaves a quiet change waiting', async () => {
    const { deps, cloud } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.pendingChangeStore
      .getState()
      .save(makePendingChange({ table: 'preferences', entityId: 'p1', op: 'save', at: AT }))

    await expect(syncNow(deps)).resolves.toEqual({ kind: 'clean' })

    expect(cloud.scopes).toEqual([deps.held])
    expect(cloud.scopes.flat()).not.toContain('preferences')
    expect(log().map((change) => change.id)).toEqual(['preferences:p1'])

    function log() {
      return selectPendingChanges(deps.pendingChangeStore.getState())
    }
  })

  it('does not raise the banner over a quiet table moving elsewhere', async () => {
    const { deps } = syncFixture()
    deps.cloud.peek = async (table) =>
      table === 'preferences' ? [{ id: 'p1', updated_at: NOW, deleted: false }] : []

    await expect(syncNow(deps)).resolves.toEqual({ kind: 'clean' })
    expect(state(deps).cloudChanged).toBe(false)
  })

  it('refuses to start offline, and touches nothing', async () => {
    const { deps, cloud, log } = syncFixture()
    deps.isOnline = () => false
    await deps.deckStore.getState().save(deck('d1'))

    await expect(syncNow(deps)).resolves.toEqual({ kind: 'offline' })
    expect(cloud.cycles).toBe(0)
    expect(log()).toHaveLength(1)
  })

  it('is clean when the cloud has not moved, and confirms what it pushed', async () => {
    const { deps, cloud, log } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))

    await expect(syncNow(deps)).resolves.toEqual({ kind: 'clean' })
    expect(cloud.cycles).toBe(1)
    expect(log()).toEqual([])
    expect(state(deps).lastSyncedAt).toBe(NOW)
  })

  it('pushes deck and folder removals silently when the cloud has not moved', async () => {
    const { deps, cloud, log } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.folderStore.getState().save(folder('f1'))
    await deps.deckStore.getState().remove('d1')
    await deps.folderStore.getState().remove('f1')

    await expect(syncNow(deps)).resolves.toEqual({ kind: 'clean' })
    expect(cloud.row('decks', 'd1')?.deleted).toBe(true)
    expect(log()).toEqual([])
  })

  it('merges when the cloud moved on documents this device never touched', async () => {
    const { deps, cloud } = syncFixture()
    cloud.write('decks', deck('remote'))

    await expect(syncNow(deps)).resolves.toEqual({ kind: 'merged' })
  })

  it('merges a document edited on both sides — the conflict handler settles it', async () => {
    const { deps, cloud } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    cloud.write('decks', { ...deck('d1'), name: 'renamed elsewhere' })

    await expect(syncNow(deps)).resolves.toEqual({ kind: 'merged' })
  })

  it('asks about a document deleted here and edited there, running no cycle', async () => {
    const { deps, cloud } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.deckStore.getState().remove('d1')
    cloud.write('decks', { ...deck('d1'), name: 'edited elsewhere' })

    await expect(syncNow(deps)).resolves.toEqual({
      kind: 'needs-review',
      items: [{ collection: 'decks', id: 'd1' }],
    })
    expect(cloud.cycles).toBe(0)
  })

  it('asks nothing about a document deleted on both sides', async () => {
    const { deps, cloud } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.deckStore.getState().remove('d1')
    cloud.write('decks', deck('d1'), true)

    await expect(syncNow(deps)).resolves.toEqual({ kind: 'merged' })
  })

  it('asks about a deleted deck another device added cards to — reading parents, not content', async () => {
    const { deps, cloud } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.deckStore.getState().remove('d1')
    cloud.write('cards', card('remote-card', 'd1'))

    await expect(syncNow(deps)).resolves.toEqual({
      kind: 'needs-review',
      items: [
        {
          collection: 'decks',
          id: 'd1',
          descendants: [{ collection: 'cards', id: 'remote-card' }],
        },
      ],
    })
    expect(cloud.fetched).toEqual([])
  })

  it('finds another device’s additions at any depth under a deleted folder', async () => {
    const { deps, cloud } = syncFixture()
    await deps.folderStore.getState().save(folder('f1'))
    await deps.folderStore.getState().remove('f1')
    cloud.write('decks', deck('new-deck', { folderId: 'f1' }))
    cloud.write('cards', card('deep-card', 'new-deck'))

    const outcome = await syncNow(deps)

    expect(outcome.kind).toBe('needs-review')
    const [item] = outcome.kind === 'needs-review' ? outcome.items : []
    expect(item?.id).toBe('f1')
    expect(item?.descendants).toEqual(
      expect.arrayContaining([
        { collection: 'decks', id: 'new-deck' },
        { collection: 'cards', id: 'deep-card' },
      ]),
    )
  })

  it('asks about a question under a deleted deck that another device edited', async () => {
    const { deps, cloud } = syncFixture()
    await deps.questionStore.getState().save(question('q1', 'd1'))
    await deps.questionStore.getState().remove('q1')
    cloud.write('questions', { ...question('q1', 'd1'), prompt: 'edited elsewhere' })

    await expect(syncNow(deps)).resolves.toEqual({
      kind: 'needs-review',
      items: [{ collection: 'questions', id: 'q1' }],
    })
  })

  it('does not ask again about a document already answered in this Sync', async () => {
    const { deps, cloud } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.deckStore.getState().remove('d1')
    cloud.write('decks', deck('d1'))

    await expect(syncNow(deps, { answered: new Set(['decks:d1']) })).resolves.toEqual({
      kind: 'merged',
    })
  })

  it('still asks about a clash that was not among the answers', async () => {
    const { deps, cloud } = syncFixture()
    for (const id of ['d1', 'd2']) {
      await deps.deckStore.getState().save(deck(id))
      await deps.deckStore.getState().remove(id)
      cloud.write('decks', deck(id))
    }

    await expect(syncNow(deps, { answered: new Set(['decks:d1']) })).resolves.toEqual({
      kind: 'needs-review',
      items: [{ collection: 'decks', id: 'd2' }],
    })
  })

  describe('checkpoints', () => {
    it('step over the rows this device pushed, so its own echo is not news', async () => {
      const { deps, cloud } = syncFixture()
      cloud.write('decks', deck('remote'))
      await deps.deckStore.getState().save(deck('mine'))

      await syncNow(deps)

      expect(state(deps).checkpoints.decks).toEqual({
        updated_at: cloud.row('decks', 'mine')?.updated_at,
        id: 'mine',
      })
      expect(state(deps).cloudChanged).toBe(false)
      await expect(cloud.peek('decks', state(deps).checkpoints.decks ?? null)).resolves.toEqual([])
    })

    it('stop short of another device’s row that landed during the cycle, and say the cloud moved', async () => {
      const { deps, cloud } = syncFixture()
      await deps.deckStore.getState().save(deck('mine'))
      cloud.duringCycle = () => cloud.write('decks', deck('mid-sync'))

      await syncNow(deps)

      const next = await cloud.peek('decks', state(deps).checkpoints.decks ?? null)
      expect(next.map((change) => change.id)).toContain('mid-sync')
      expect(state(deps).cloudChanged).toBe(true)
    })
  })

  it('leaves the log and the checkpoints untouched when the cycle fails', async () => {
    const { deps, cloud, log } = syncFixture()
    cloud.write('decks', deck('remote'))
    await deps.deckStore.getState().save(deck('d1'))
    cloud.failNextCycle('push refused')

    await expect(syncNow(deps)).resolves.toEqual({ kind: 'failed', reason: 'push refused' })
    expect(log()).toHaveLength(1)
    expect(state(deps).checkpoints.decks).toBeUndefined()
    expect(state(deps).lastSyncedAt).toBeNull()
  })

  it('refreshes the session and tries once more when the server refused the token', async () => {
    const { deps, cloud, log } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    cloud.failNextCycle('invalid JWT: unable to parse or verify signature')
    let refreshed = 0
    deps.refreshAuth = async () => {
      refreshed += 1
      return true
    }

    await expect(syncNow(deps)).resolves.toEqual({ kind: 'clean' })
    expect(refreshed).toBe(1)
    // The refused attempt and the one behind the new token, which pushed and confirmed the deck.
    expect(cloud.cycles).toBe(2)
    expect(log()).toEqual([])
  })

  it('gives up after one refresh rather than looping on a token it cannot mend', async () => {
    const { deps, cloud } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    cloud.failNextCycle('JWT expired')
    cloud.duringCycle = async () => {
      cloud.failNextCycle('JWT expired')
    }
    let refreshed = 0
    deps.refreshAuth = async () => {
      refreshed += 1
      return true
    }

    const outcome = await syncNow(deps)
    expect(outcome.kind).toBe('failed')
    expect(refreshed).toBe(1)
  })

  it('does not refresh for a failure that has nothing to do with the token', async () => {
    const { deps, cloud } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    cloud.failNextCycle('Failed to fetch')
    let refreshed = 0
    deps.refreshAuth = async () => {
      refreshed += 1
      return true
    }

    await expect(syncNow(deps)).resolves.toEqual({ kind: 'failed', reason: 'Failed to fetch' })
    expect(refreshed).toBe(0)
  })

  it('names a device clock the learner can fix instead of repeating the server', async () => {
    const { deps, cloud } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    cloud.failNextCycle('invalid JWT: token used before issued')
    deps.refreshAuth = async () => true

    const outcome = await syncNow(deps)
    expect(outcome).toEqual({ kind: 'failed', reason: 'clock' })
  })

  it('keeps a write made during the cycle pending', async () => {
    const { deps, cloud, log } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    cloud.duringCycle = async () => {
      await deps.deckStore.getState().save(deck('d2'))
    }

    await syncNow(deps)

    expect(log().map((row) => row.entityId)).toEqual(['d2'])
  })

  it('leaves a change on a table the cycle does not cover waiting — an extension that is off', async () => {
    const { deps, log } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.pendingChangeStore
      .getState()
      .save(makePendingChange({ table: 'bible_verses', entityId: 'v1', op: 'save', at: AT }))
    deps.tables = deps.tables.filter((table) => table !== 'bible_verses')

    await expect(syncNow(deps)).resolves.toEqual({ kind: 'clean' })

    expect(log().map((row) => row.id)).toEqual(['bible_verses:v1'])
  })

  describe('the device’s log of its Syncs', () => {
    it('records a landed cycle with how much it pushed and pulled', async () => {
      const { deps, cloud } = syncFixture()
      cloud.write('decks', deck('remote'))
      await deps.deckStore.getState().save(deck('d1'))

      await syncNow(deps)

      expect(state(deps).log).toEqual([{ at: NOW, outcome: 'merged', pushed: 1, pulled: 1 }])
    })

    it('records a failed cycle with its reason, touching nothing else', async () => {
      const { deps, cloud } = syncFixture()
      cloud.failNextCycle('push refused')

      await syncNow(deps)

      expect(state(deps).log).toEqual([
        { at: NOW, outcome: 'failed', pushed: 0, pulled: 0, reason: 'push refused' },
      ])
      expect(state(deps).lastSyncedAt).toBeNull()
    })

    it('records a cycle that stopped to ask', async () => {
      const { deps, cloud } = syncFixture()
      cloud.write('decks', deck('d1'))
      await deps.deckStore.getState().save(deck('d1'))
      await deps.deckStore.getState().remove('d1')
      cloud.write('decks', { ...deck('d1'), name: 'edited elsewhere' })

      await syncNow(deps)

      expect(state(deps).log[0]?.outcome).toBe('needs-review')
    })

    it('keeps the newest ten', async () => {
      const { deps } = syncFixture()
      for (let i = 0; i < 12; i += 1) await syncNow(deps)
      expect(state(deps).log).toHaveLength(10)
    })
  })

  describe('repairSync', () => {
    it('drops the checkpoints and syncs again, reading the whole cloud from the first', async () => {
      const { deps, cloud } = syncFixture({
        state: { checkpoints: { decks: { updated_at: '2026-02-01T00:00:00.000Z', id: 'x' } } },
      })
      cloud.write('decks', deck('remote'))

      await expect(repairSync(deps)).resolves.toEqual({ kind: 'merged' })

      expect(cloud.rereads).toBe(1)
      expect(cloud.cycles).toBe(1)
      expect(state(deps).checkpoints.decks).toEqual({
        updated_at: cloud.row('decks', 'remote')?.updated_at,
        id: 'remote',
      })
    })

    it('keeps the writes that were waiting', async () => {
      const { deps, log } = syncFixture()
      await deps.deckStore.getState().save(deck('d1'))
      deps.isOnline = () => false

      await expect(repairSync(deps)).resolves.toEqual({ kind: 'offline' })

      expect(log()).toHaveLength(1)
    })
  })
})
