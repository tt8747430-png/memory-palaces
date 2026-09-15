import type { RxCollection } from 'rxdb'
import type { RxReplicationState } from 'rxdb/plugins/replication'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Checkpoint, Identifiable, PushedIds, RemoteChangeEvent } from '@/shared/api'
import { SYNCED_TABLES, type SyncedTable } from '@/shared/config/sync-tables'
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
  onRemoteChange: (event: RemoteChangeEvent) => void,
) => CloudWatcher

/**
 * The replication lifecycle, as one unit: the Realtime watcher for as long as an account is signed
 * in, and one replication per table for the length of one cycle.
 *
 * Sync is user-initiated, so being signed in no longer means replicating: `start` only opens the
 * watcher that lights the banner. Scheduling belongs to `SyncProvider`, classification to `syncNow`
 * and the read-only cloud queries to `createSupabaseCloudSync`; this class absorbs none of them.
 */
export class SyncManager {
  private userId: string | null = null
  private watcher: CloudWatcher | null = null
  private running: Promise<PushedIds> | null = null

  /** Targets may still be opening — the RxDB collections exist a tick after the app boots. */
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
          onPushed,
        }),
      (userId, onRemoteChange) =>
        createCloudWatcher(supabase, SYNCED_TABLES, userId, onRemoteChange),
    )
  }

  /**
   * Idempotent for the same user; a different user replaces the subscription. Starts no
   * replication — nothing leaves the device until a Sync asks.
   */
  async start(
    userId: string,
    onRemoteChange: (event: RemoteChangeEvent) => void = () => {},
  ): Promise<void> {
    if (this.userId === userId) return
    await this.stop()
    this.userId = userId
    this.watcher = this.watch(userId, onRemoteChange)
  }

  /**
   * One apply-then-push pass. Concurrent callers join the pass already running rather than starting
   * a second one — Autosync's reconnect and a pressed Synchronise can land in the same tick.
   *
   * Rejects before `start`, and never resolves empty instead: `syncNow` reads a resolved cycle as
   * "everything pushed" and clears the pending log on the strength of it. Resolving `{}` here with
   * nothing pushed was how a Sync fired during the unsynced-reset hold erased the previous
   * account's log without a byte leaving the device.
   */
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

  /**
   * RxDB retries a failed push or pull forever and reports each failure on `error$` alone —
   * `awaitInSync()` has no error path, so awaiting it on its own turns an offline moment into a Sync
   * that never ends. The first error of any table therefore fails the whole cycle, and every
   * replication is cancelled either way.
   */
  private async cycle(userId: string): Promise<PushedIds> {
    const targets = await this.targets
    // A sign-out (or another user) may have landed while the collections were opening. Reject, for
    // the same reason `runCycle` does: a cycle that pushed nothing must not read as one that did.
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
