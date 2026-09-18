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

export class SyncManager {
  private userId: string | null = null
  private watcher: CloudWatcher | null = null
  private running: Promise<PushedIds> | null = null

  constructor(
    private readonly targets: SyncTarget[] | Promise<SyncTarget[]>,
    /**
     * The tables the watcher subscribes to. Held apart from `targets` on purpose: a table name is
     * known before the database opens, and the watcher must not wait on it. Both come from the one
     * list the composition root composes, so they cannot drift.
     */
    private readonly tables: readonly SyncedTable[],
    private readonly makeReplication: ReplicationFactory,
    private readonly watch: WatcherFactory = () => ({ stop: async () => {} }),
    /**
     * Whether a table replicates right now. A contributed table only does while the extension that
     * owns it is on, and that is a preference the manager cannot see — hence a predicate, read at
     * cycle time rather than captured at construction.
     */
    private readonly isActive: (table: SyncedTable) => boolean = () => true,
  ) {}

  static fromSupabase(
    supabase: SupabaseClient,
    targets: SyncTarget[] | Promise<SyncTarget[]>,
    tables: readonly SyncedTable[],
    isActive?: (table: SyncedTable) => boolean,
  ): SyncManager {
    return new SyncManager(
      targets,
      tables,
      (userId, target, onPushed) =>
        createCollectionReplication({
          supabase,
          userId,
          table: target.table,
          collection: target.collection,
          onPushed,
        }),
      (userId, tables, onRemoteChange) =>
        createCloudWatcher(supabase, tables, userId, onRemoteChange),
      isActive,
    )
  }

  async start(
    userId: string,
    onRemoteChange: (event: RemoteChangeEvent) => void = () => {},
  ): Promise<void> {
    if (this.userId === userId) return
    await this.stop()
    this.userId = userId
    this.watcher = this.watch(userId, this.tables.filter(this.isActive), onRemoteChange)
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
    await watcher?.stop()
  }

  private async cycle(userId: string): Promise<PushedIds> {
    const targets = (await this.targets).filter((target) => this.isActive(target.table))
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
