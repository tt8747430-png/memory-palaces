import { describe, expect, it, vi } from 'vitest'
import { SyncManager, type SyncTarget } from './sync-manager'

const fakeReplication = () => ({
  reSync: vi.fn(),
  awaitInSync: vi.fn().mockResolvedValue(true),
  cancel: vi.fn().mockResolvedValue(undefined),
})

function setup(tableCount = 2) {
  const created: ReturnType<typeof fakeReplication>[] = []
  const targets: SyncTarget[] = Array.from({ length: tableCount }, (_, i) => ({
    table: `t${i}`,
    collection: {} as never,
  }))
  const manager = new SyncManager(targets, () => {
    const replication = fakeReplication()
    created.push(replication)
    return replication as never
  })
  return { manager, created }
}

describe('SyncManager', () => {
  it('starts one replication per registered collection and flushes them all', async () => {
    const { manager, created } = setup()

    await manager.start('u1')
    await manager.flush()

    expect(created).toHaveLength(2)
    expect(created[0]?.reSync).toHaveBeenCalled()
    expect(created[1]?.awaitInSync).toHaveBeenCalled()
  })

  it('is a no-op flush before start', async () => {
    const { manager } = setup(0)
    await expect(manager.flush()).resolves.toBeUndefined()
  })

  it('ignores a repeated start for the same user', async () => {
    const { manager, created } = setup()

    await manager.start('u1')
    await manager.start('u1')

    expect(created).toHaveLength(2)
  })

  it('waits for collections that are still opening', async () => {
    const created: { table: string }[] = []
    const opening = Promise.resolve([
      { table: 'decks', collection: {} as never },
      { table: 'cards', collection: {} as never },
    ])
    const manager = new SyncManager(opening, (_userId, target) => {
      created.push({ table: target.table })
      return fakeReplication() as never
    })

    await manager.start('u1')

    expect(created.map((c) => c.table)).toEqual(['decks', 'cards'])
  })

  it('replaces the replications when a different user signs in', async () => {
    const { manager, created } = setup()

    await manager.start('u1')
    await manager.start('u2')

    expect(created).toHaveLength(4)
    expect(created[0]?.cancel).toHaveBeenCalled()
  })

  it('cancels everything on stop and can be started again', async () => {
    const { manager, created } = setup()

    await manager.start('u1')
    await manager.stop()
    expect(created[0]?.cancel).toHaveBeenCalled()

    await manager.start('u1')
    expect(created).toHaveLength(4)
  })
})
