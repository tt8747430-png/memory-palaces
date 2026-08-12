import type { RxCollection } from 'rxdb'
import type { RxReplicationState } from 'rxdb/plugins/replication'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Identifiable } from '@/shared/api'
import { type Checkpoint, createCollectionReplication } from './replication'

export interface SyncTarget {
  table: string
  collection: RxCollection<Identifiable>
}

type ReplicationState = RxReplicationState<Identifiable, Checkpoint>
type ReplicationFactory = (userId: string, target: SyncTarget) => ReplicationState

/**
 * Owns every collection's replication as one unit, so the app has a single place to say "this user
 * is signed in", "we are leaving — get everything out", and "stop".
 */
export class SyncManager {
  private states: ReplicationState[] = []
  private userId: string | null = null

  /** Targets may still be opening — the RxDB collections exist a tick after the app boots. */
  constructor(
    private readonly targets: SyncTarget[] | Promise<SyncTarget[]>,
    private readonly makeReplication: ReplicationFactory,
  ) {}

  static fromSupabase(
    supabase: SupabaseClient,
    targets: SyncTarget[] | Promise<SyncTarget[]>,
  ): SyncManager {
    return new SyncManager(targets, (userId, target) =>
      createCollectionReplication({
        supabase,
        userId,
        table: target.table,
        collection: target.collection,
      }),
    )
  }

  /** Idempotent for the same user; a different user replaces every replication. */
  async start(userId: string): Promise<void> {
    if (this.userId === userId) return
    if (this.states.length) await this.stop()
    this.userId = userId
    const targets = await this.targets
    // A sign-out (or another user) may have landed while the collections were opening.
    if (this.userId !== userId) return
    this.states = targets.map((target) => this.makeReplication(userId, target))
  }

  /** Best-effort "get everything out now" — used when the app is being backgrounded or closed. */
  async flush(): Promise<void> {
    await Promise.all(
      this.states.map(async (state) => {
        state.reSync()
        await state.awaitInSync()
      }),
    )
  }

  async stop(): Promise<void> {
    const states = this.states
    this.states = []
    this.userId = null
    await Promise.all(states.map((state) => state.cancel()))
  }
}
