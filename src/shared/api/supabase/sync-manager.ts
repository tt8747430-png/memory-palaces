import type { RxCollection } from 'rxdb'
import type { RxReplicationState } from 'rxdb/plugins/replication'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Checkpoint, Identifiable, PushedIds, RemoteChangeEvent } from '@/shared/api'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { createCollectionReplication } from './replication'
import { type CloudWatcher, createCloudWatcher } from './cloud-watcher'

export interface SyncTarget {
  table: SyncedTable
  collection: RxCollection<Identifiable>
  /** See `CollectionReplicationOptions.refuseUnseenOverwrites`. */
  refuseUnseenOverwrites?: boolean
}

type ReplicationState = RxReplicationState<Identifiable, Checkpoint>
type ReplicationFactory = (
  userId: string,
  target: SyncTarget,
  onPushed: (ids: readonly string[]) => void,
) => ReplicationState
type WatcherFactory = (
  userId: string,
  tables: readonly SyncedTable[],
  onRemoteChange: (event: RemoteChangeEvent) => void,
) => CloudWatcher

const sameTables = (a: readonly SyncedTable[], b: readonly SyncedTable[]): boolean =>
  a.length === b.length && a.every((table, index) => table === b[index])

export class SyncManager {
  private userId: string | null = null
  private watcher: CloudWatcher | null = null
  private running: Promise<PushedIds> | null = null
  /**
   * The tables this session replicates, as `start` was told. Empty until then — `runCycle` refuses
   * without an account anyway, so there is no window where the manager has targets but no list.
   */
  private tables: readonly SyncedTable[] = []

  constructor(
    private readonly targets: SyncTarget[] | Promise<SyncTarget[]>,
    private readonly makeReplication: ReplicationFactory,
    private readonly watch: WatcherFactory = () => ({ stop: async () => {} }),
  ) {}

  static fromSupabase(
    supabase: SupabaseClient,
    targets: SyncTarget[] | Promise<SyncTarget[]>,
  ): SyncManager {
    return new SyncManager(
      targets,
      (userId, target, onPushed) =>
        createCollectionReplication({
          supabase,
          userId,
          table: target.table,
          collection: target.collection,
          refuseUnseenOverwrites: target.refuseUnseenOverwrites,
          onPushed,
        }),
      (userId, tables, onRemoteChange) =>
        createCloudWatcher(supabase, tables, userId, onRemoteChange),
    )
  }

  /**
   * `tables` is the live set, composed by the caller from the enabled extensions — the manager does
   * not read preferences. Passing a different set restarts the watcher, which is what makes
   * toggling an extension take effect; nothing is awaited here, so a watcher never waits on the
   * database opening.
   */
  async start(
    userId: string,
    tables: readonly SyncedTable[],
    onRemoteChange: (event: RemoteChangeEvent) => void = () => {},
  ): Promise<void> {
    const next = [...tables]
    if (this.userId === userId && sameTables(this.tables, next)) return
    await this.stop()
    this.userId = userId
    this.tables = next
    this.watcher = this.watch(userId, next, onRemoteChange)
  }

  runCycle(): Promise<PushedIds> {
    const userId = this.userId
    if (!userId) return Promise.reject(new Error('No account is signed in to synchronise as'))
    this.running ??= this.cycle(userId).finally(() => {
      this.running = null
    })
    return this.running
  }

  async stop(): Promise<void> {
    const watcher = this.watcher
    this.watcher = null
    this.userId = null
    this.tables = []
    await watcher?.stop()
  }

  private async cycle(userId: string): Promise<PushedIds> {
    const live = new Set(this.tables)
    const targets = (await this.targets).filter((target) => live.has(target.table))
    if (this.userId !== userId) throw new Error('The account changed before the cycle could start')

    const pushed = new Map<SyncedTable, Set<string>>()
    const states = targets.map((target) =>
      this.makeReplication(userId, target, (ids) => {
        const seen = pushed.get(target.table) ?? new Set<string>()
        for (const id of ids) seen.add(id)
        pushed.set(target.table, seen)
      }),
    )

    const subscriptions: { unsubscribe: () => void }[] = []
    const failed = new Promise<never>((_, reject) => {
      for (const state of states) subscriptions.push(state.error$.subscribe(reject))
    })

    try {
      await Promise.race([
        Promise.all(
          states.map(async (state) => {
            state.reSync()
            await state.awaitInSync()
          }),
        ),
        failed,
      ])
    } finally {
      for (const subscription of subscriptions) subscription.unsubscribe()
      await Promise.all(states.map((state) => state.cancel()))
    }

    return Object.fromEntries([...pushed].map(([table, ids]) => [table, [...ids]])) as PushedIds
  }
}
