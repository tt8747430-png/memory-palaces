import { describe, expect, it, vi } from 'vitest'
import { Subject } from 'rxjs'
import type { RemoteChangeEvent, RemoteChangeHandlers } from '@/shared/api'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { SyncManager, type SyncTarget } from './sync-manager'

function fakeReplication() {
  const error$ = new Subject<Error>()
  return {
    error$,
    reSync: vi.fn(),
    awaitInSync: vi.fn().mockResolvedValue(true),
    cancel: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    autoStart: true,
  }
}

type Fake = ReturnType<typeof fakeReplication>

/**
 * `tables` is what the database holds; what a session actually replicates is whatever `start` is
 * given, which defaults to all of them. `start` here is the harness's, not the manager's.
 */
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
  const watch = vi.fn(
    (_userId: string, _tables: readonly SyncedTable[], _handlers: RemoteChangeHandlers) => ({
      stop,
    }),
  )
  const targets: SyncTarget[] = tables.map((table) => ({ table, collection: {} as never }))
  const manager = new SyncManager(
    targets,
    (_userId, target, onPushed, autoStart) => {
      const replication = fakeReplication()
      replication.autoStart = autoStart
      configure(replication, onPushed, target.table)
      created.push(replication)
      return replication as never
    },
    watch,
  )
  const start = (
    userId = 'u1',
    active: readonly SyncedTable[] = tables,
    handlers?: RemoteChangeHandlers,
  ) => manager.start(userId, active, handlers)
  return { manager, created, watch, stop, start }
}

describe('SyncManager', () => {
  it('starts no replication when an account signs in — only the cloud watcher', async () => {
    const { created, watch, start } = setup()

    await start()

    expect(created).toHaveLength(0)
    expect(watch).toHaveBeenCalledWith('u1', ['decks', 'cards'], expect.any(Object))
  })

  it('runs one replication per table for a cycle and cancels them all afterwards', async () => {
    const { manager, created, start } = setup()
    await start()

    await manager.runCycle()

    expect(created).toHaveLength(2)
    for (const replication of created) {
      expect(replication.reSync).toHaveBeenCalled()
      expect(replication.cancel).toHaveBeenCalled()
    }
  })

  it('reports which rows the cycle pushed, per table', async () => {
    const { manager, start } = setup(['decks', 'cards'], (replication, push, table) => {
      replication.awaitInSync.mockImplementation(async () => {
        push(table === 'decks' ? ['d1', 'd2'] : ['c1'])
        push(table === 'decks' ? ['d2'] : [])
        return true
      })
    })
    await start()

    await expect(manager.runCycle()).resolves.toEqual({ decks: ['d1', 'd2'], cards: ['c1'] })
  })

  it('fails the cycle on the first replication error rather than waiting forever', async () => {
    const { manager, created, start } = setup(['decks'], (replication) => {
      replication.awaitInSync.mockReturnValue(new Promise(() => {}))
      queueMicrotask(() => replication.error$.next(new Error('push refused')))
    })
    await start()

    await expect(manager.runCycle()).rejects.toThrow('push refused')
    expect(created[0]?.cancel).toHaveBeenCalled()
  })

  it('cancels the replications when awaiting them fails', async () => {
    const { manager, created, start } = setup(['decks'], (replication) => {
      replication.awaitInSync.mockRejectedValue(new Error('storage closed'))
    })
    await start()

    await expect(manager.runCycle()).rejects.toThrow('storage closed')
    expect(created[0]?.cancel).toHaveBeenCalled()
  })

  it('joins a cycle already running rather than starting a second one', async () => {
    const { manager, created, start } = setup()
    await start()

    await Promise.all([manager.runCycle(), manager.runCycle()])

    expect(created).toHaveLength(2)
  })

  it('starts a fresh cycle once the previous one has finished', async () => {
    const { manager, created, start } = setup()
    await start()

    await manager.runCycle()
    await manager.runCycle()

    expect(created).toHaveLength(4)
  })

  it('forgets every live replication without running one, and only for an account', async () => {
    const { manager, created, start } = setup(['decks', 'cards', 'bible_verses'])
    await expect(manager.forget()).rejects.toThrow(/no account/i)
    await start('u1', ['decks', 'cards'])

    await manager.forget()

    expect(created).toHaveLength(2)
    for (const replication of created) {
      expect(replication.autoStart).toBe(false)
      expect(replication.remove).toHaveBeenCalled()
      expect(replication.reSync).not.toHaveBeenCalled()
    }
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
    await manager.start('u1', ['decks'])

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

    await manager.start('u1', ['decks', 'cards'])
    await manager.runCycle()

    expect(tables).toEqual(['decks', 'cards'])
  })

  it('ignores a repeated start for the same user, and replaces the watcher for another', async () => {
    const { watch, stop, start } = setup()

    await start()
    await start()
    expect(watch).toHaveBeenCalledTimes(1)

    await start('u2')
    expect(stop).toHaveBeenCalledTimes(1)
    expect(watch).toHaveBeenCalledTimes(2)
  })

  it('stops watching on stop, and stops cycling with it', async () => {
    const { manager, created, stop, start } = setup()
    await start()

    await manager.stop()

    expect(stop).toHaveBeenCalled()
    await expect(manager.runCycle()).rejects.toThrow(/no account/i)
    expect(created).toHaveLength(0)
  })

  it('hands the watcher’s events to whoever started it, applying nothing itself', async () => {
    const seen: RemoteChangeEvent[] = []
    const { watch, start } = setup()

    await start('u1', undefined, { onChange: (event) => seen.push(event), onReconnect: () => {} })
    const [, , forward] = watch.mock.lastCall ?? []
    forward?.onChange({ table: 'decks', id: 'd1', updated_at: '2026-01-01T00:00:00Z' })

    expect(seen).toEqual([{ table: 'decks', id: 'd1', updated_at: '2026-01-01T00:00:00Z' }])
  })

  describe('a table that only replicates while its extension is on', () => {
    const TABLES: SyncedTable[] = ['decks', 'cards', 'bible_verses']
    const WITHOUT_BIBLE: SyncedTable[] = ['decks', 'cards']

    it('leaves the switched-off table out of the cycle', async () => {
      const pushed: SyncedTable[] = []
      const { manager, created, start } = setup(TABLES, (_replication, _push, table) =>
        pushed.push(table),
      )
      await start('u1', WITHOUT_BIBLE)

      await manager.runCycle()

      expect(created).toHaveLength(2)
      expect(pushed).toEqual(['decks', 'cards'])
    })

    it('includes it once the live set names it', async () => {
      const pushed: SyncedTable[] = []
      const { manager, start } = setup(TABLES, (_replication, _push, table) => pushed.push(table))
      await start('u1', TABLES)

      await manager.runCycle()

      expect(pushed).toEqual(['decks', 'cards', 'bible_verses'])
    })

    it('rebuilds the watcher over the new set when the extension is switched on', async () => {
      const { watch, stop, start } = setup(TABLES)

      await start('u1', WITHOUT_BIBLE)
      expect(watch).toHaveBeenLastCalledWith('u1', WITHOUT_BIBLE, expect.any(Object))

      await start('u1', TABLES)

      expect(stop).toHaveBeenCalledTimes(1)
      expect(watch).toHaveBeenLastCalledWith('u1', TABLES, expect.any(Object))
    })

    it('leaves the watcher alone when the same account restarts over the same set', async () => {
      const { watch, stop, start } = setup(TABLES)

      await start('u1', WITHOUT_BIBLE)
      await start('u1', [...WITHOUT_BIBLE])

      expect(watch).toHaveBeenCalledTimes(1)
      expect(stop).not.toHaveBeenCalled()
    })

    it('never reports the skipped table as pushed, so its checkpoint is untouched', async () => {
      const { manager, start } = setup(TABLES, (_replication, push, table) => push([`${table}-1`]))
      await start('u1', WITHOUT_BIBLE)

      const result = await manager.runCycle()

      expect(result).toEqual({ decks: ['decks-1'], cards: ['cards-1'] })
      expect(result).not.toHaveProperty('bible_verses')
    })
  })
})
