import type { RxCollection } from 'rxdb'
import type { RxReplicationState } from 'rxdb/plugins/replication'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type Checkpoint,
  type Identifiable,
  NO_REMOTE_CHANGE_HANDLERS,
  type PushedIds,
  type RemoteChangeHandlers,
} from '@/shared/api'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { createCollectionReplication } from './replication'
import { type CloudWatcher, createCloudWatcher } from './cloud-watcher'

export interface SyncTarget {
  table: SyncedTable
  collection: RxCollection<Identifiable>
}

type ReplicationState = RxReplicationState<Identifiable, Checkpoint>

/** What one cycle asks of each replication it builds. */
interface CycleReplication {
  onPushed: (ids: readonly string[]) => void
  /** Pull from the first document, not from the checkpoint — the cycle after `rereadEverything`. */
  fromStart: boolean
}

type ReplicationFactory = (
  userId: string,
  target: SyncTarget,
  cycle: CycleReplication,
) => ReplicationState
type WatcherFactory = (
  userId: string,
  tables: readonly SyncedTable[],
  handlers: RemoteChangeHandlers,
) => CloudWatcher

const sameTables = (a: readonly SyncedTable[], b: readonly SyncedTable[]): boolean =>
  a.length === b.length && a.every((table, index) => table === b[index])

/** A cycle in flight, and the tables it covers — what lets a later request join it or queue behind. */
interface RunningCycle {
  tables: ReadonlySet<SyncedTable>
  promise: Promise<PushedIds>
}

export class SyncManager {
  private userId: string | null = null
  private watcher: CloudWatcher | null = null
  private running: RunningCycle | null = null
  /** Names each cycle this manager has started, so only the newest clears `running`. */
  private cycleId = 0
  /** Set by `rereadEverything`, cleared by the first cycle after it that finishes. */
  private rereading = false
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
      (userId, target, { onPushed, fromStart }) =>
        createCollectionReplication({
          supabase,
          userId,
          table: target.table,
          collection: target.collection,
          onPushed,
          fromStart,
        }),
      (userId, tables, handlers) => createCloudWatcher(supabase, tables, userId, handlers),
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
    handlers: RemoteChangeHandlers = NO_REMOTE_CHANGE_HANDLERS,
  ): Promise<void> {
    const next = [...tables]
    if (this.userId === userId && sameTables(this.tables, next)) return
    await this.stop()
    this.userId = userId
    this.tables = next
    this.watcher = this.watch(userId, next, handlers)
  }

  /**
   * One cycle over `tables`, narrowed to the ones this session replicates. One runs at a time: a
   * request the running cycle already covers joins it, and any other waits it out rather than
   * building a second replication over the same collection. That is what keeps a quiet push from
   * carrying the held tables — and a Synchronise tapped during one from racing it.
   */
  runCycle(tables: readonly SyncedTable[]): Promise<PushedIds> {
    const userId = this.userId
    if (!userId) return Promise.reject(new Error('No account is signed in to synchronise as'))
    const live = new Set(this.tables)
    const wanted = tables.filter((table) => live.has(table))
    const running = this.running
    if (running && wanted.every((table) => running.tables.has(table))) return running.promise

    const id = ++this.cycleId
    const promise = (async () => {
      await running?.promise.catch(() => {})
      try {
        return await this.cycle(userId, wanted)
      } finally {
        // Only if nothing queued behind this one: a later request owns `running` from then on.
        if (this.cycleId === id) this.running = null
      }
    })()
    this.running = { tables: new Set(wanted), promise }
    return promise
  }

  /**
   * The next cycle reads every cloud document again from the first, not from where the last one
   * got to — for rows a checkpoint stepped past. Only the checkpoint is passed over: what each
   * document was based on stays, so a change still waiting here merges field by field against it
   * (ADR 0005). Forgetting that too would leave every such change to the newer whole document.
   *
   * Waits out a running cycle, which started without it, so the next `runCycle` starts a fresh one
   * rather than joining that. Holds until a cycle that read from the first finishes, so one that
   * fails leaves the next to read from the first again.
   */
  async rereadEverything(): Promise<void> {
    if (!this.userId) throw new Error('No account is signed in to synchronise as')
    this.rereading = true
    await this.running?.promise.catch(() => {})
  }

  async stop(): Promise<void> {
    const watcher = this.watcher
    this.watcher = null
    this.userId = null
    this.tables = []
    this.rereading = false
    await watcher?.stop()
  }

  private async cycle(userId: string, tables: readonly SyncedTable[]): Promise<PushedIds> {
    const scope = new Set(tables)
    const targets = (await this.targets).filter((target) => scope.has(target.table))
    if (this.userId !== userId) throw new Error('The account changed before the cycle could start')

    // Only a cycle over every live table can answer `rereadEverything`; a scoped one leaves the
    // flag standing, so the tables it never touched are still read from the first document.
    const coversEverything = this.tables.every((table) => scope.has(table))
    const fromStart = this.rereading && coversEverything
    const pushed = new Map<SyncedTable, Set<string>>()
    const states = targets.map((target) =>
      this.makeReplication(userId, target, {
        onPushed: (ids) => {
          const seen = pushed.get(target.table) ?? new Set<string>()
          for (const id of ids) seen.add(id)
          pushed.set(target.table, seen)
        },
        fromStart,
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

    if (fromStart && this.userId === userId) this.rereading = false
    return Object.fromEntries([...pushed].map(([table, ids]) => [table, [...ids]])) as PushedIds
  }
}
