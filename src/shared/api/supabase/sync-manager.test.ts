import { describe, expect, it, vi } from 'vitest'
import { Subject } from 'rxjs'
import type { RemoteChangeEvent } from '@/shared/api'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { SyncManager, type SyncTarget } from './sync-manager'

function fakeReplication() {
  const error$ = new Subject<Error>()
  return {
    error$,
    reSync: vi.fn(),
    awaitInSync: vi.fn().mockResolvedValue(true),
    cancel: vi.fn().mockResolvedValue(undefined),
  }
}

type Fake = ReturnType<typeof fakeReplication>

function setup(
  tables: SyncedTable[] = ['decks', 'cards'],
  configure: (
    replication: Fake,
    push: (ids: string[]) => void,
    table: SyncedTable,
  ) => void = () => {},
) {
  const created: Fake[] = []
  const stop = vi.fn().mockResolvedValue(undefined)
  const watch = vi.fn((_userId: string, _onRemoteChange: (event: RemoteChangeEvent) => void) => ({
    stop,
  }))
  const targets: SyncTarget[] = tables.map((table) => ({ table, collection: {} as never }))
  const manager = new SyncManager(
    targets,
    (_userId, target, onPushed) => {
      const replication = fakeReplication()
      configure(replication, onPushed, target.table)
      created.push(replication)
      return replication as never
    },
    watch,
  )
  return { manager, created, watch, stop }
}

describe('SyncManager', () => {
  it('starts no replication when an account signs in — only the cloud watcher', async () => {
    const { manager, created, watch } = setup()

    await manager.start('u1')

    expect(created).toHaveLength(0)
    expect(watch).toHaveBeenCalledWith('u1', expect.any(Function))
  })

  it('runs one replication per table for a cycle and cancels them all afterwards', async () => {
    const { manager, created } = setup()
    await manager.start('u1')

    await manager.runCycle()

    expect(created).toHaveLength(2)
    for (const replication of created) {
      expect(replication.reSync).toHaveBeenCalled()
      expect(replication.cancel).toHaveBeenCalled()
    }
  })

  it('reports which rows the cycle pushed, per table', async () => {
    const { manager } = setup(['decks', 'cards'], (replication, push, table) => {
      replication.awaitInSync.mockImplementation(async () => {
        push(table === 'decks' ? ['d1', 'd2'] : ['c1'])
        push(table === 'decks' ? ['d2'] : [])
        return true
      })
    })
    await manager.start('u1')

    await expect(manager.runCycle()).resolves.toEqual({ decks: ['d1', 'd2'], cards: ['c1'] })
  })

  it('fails the cycle on the first replication error rather than waiting forever', async () => {
    // RxDB retries a failed push forever and never rejects awaitInSync — the error only surfaces here.
    const { manager, created } = setup(['decks'], (replication) => {
      replication.awaitInSync.mockReturnValue(new Promise(() => {}))
      queueMicrotask(() => replication.error$.next(new Error('push refused')))
    })
    await manager.start('u1')

    await expect(manager.runCycle()).rejects.toThrow('push refused')
    expect(created[0]?.cancel).toHaveBeenCalled()
  })

  it('cancels the replications when awaiting them fails', async () => {
    const { manager, created } = setup(['decks'], (replication) => {
      replication.awaitInSync.mockRejectedValue(new Error('storage closed'))
    })
    await manager.start('u1')

    await expect(manager.runCycle()).rejects.toThrow('storage closed')
    expect(created[0]?.cancel).toHaveBeenCalled()
  })

  it('joins a cycle already running rather than starting a second one', async () => {
    const { manager, created } = setup()
    await manager.start('u1')

    await Promise.all([manager.runCycle(), manager.runCycle()])

    expect(created).toHaveLength(2)
  })

  it('starts a fresh cycle once the previous one has finished', async () => {
    const { manager, created } = setup()
    await manager.start('u1')

    await manager.runCycle()
    await manager.runCycle()

    expect(created).toHaveLength(4)
  })

  it('refuses to run before an account signs in — a cycle that pushed nothing must not read as done', async () => {
    const { manager, created } = setup()
    await expect(manager.runCycle()).rejects.toThrow(/no account/i)
    expect(created).toHaveLength(0)
  })

  it('rejects a cycle the account signed out from under while the collections were opening', async () => {
    let open: (targets: SyncTarget[]) => void = () => {}
    const created: string[] = []
    const manager = new SyncManager(
      new Promise<SyncTarget[]>((resolve) => (open = resolve)),
      (_userId, target) => {
        created.push(target.table)
        return fakeReplication() as never
      },
    )
    await manager.start('u1')

    const cycle = manager.runCycle()
    await manager.stop()
    open([{ table: 'decks', collection: {} as never }])

    await expect(cycle).rejects.toThrow(/account changed/i)
    expect(created).toEqual([])
  })

  it('waits for collections that are still opening', async () => {
    const tables: string[] = []
    const opening = Promise.resolve<SyncTarget[]>([
      { table: 'decks', collection: {} as never },
      { table: 'cards', collection: {} as never },
    ])
    const manager = new SyncManager(opening, (_userId, target) => {
      tables.push(target.table)
      return fakeReplication() as never
    })

    await manager.start('u1')
    await manager.runCycle()

    expect(tables).toEqual(['decks', 'cards'])
  })

  it('ignores a repeated start for the same user, and replaces the watcher for another', async () => {
    const { manager, watch, stop } = setup()

    await manager.start('u1')
    await manager.start('u1')
    expect(watch).toHaveBeenCalledTimes(1)

    await manager.start('u2')
    expect(stop).toHaveBeenCalledTimes(1)
    expect(watch).toHaveBeenCalledTimes(2)
  })

  it('stops watching on stop, and stops cycling with it', async () => {
    const { manager, created, stop } = setup()
    await manager.start('u1')

    await manager.stop()

    expect(stop).toHaveBeenCalled()
    await expect(manager.runCycle()).rejects.toThrow(/no account/i)
    expect(created).toHaveLength(0)
  })

  it('hands the watcher’s events to whoever started it, applying nothing itself', async () => {
    const seen: RemoteChangeEvent[] = []
    const { manager, watch } = setup()

    await manager.start('u1', (event) => seen.push(event))
    const [, forward] = watch.mock.lastCall ?? []
    forward?.({ table: 'decks', id: 'd1', updated_at: '2026-01-01T00:00:00Z' })

    expect(seen).toEqual([{ table: 'decks', id: 'd1', updated_at: '2026-01-01T00:00:00Z' }])
  })
})
