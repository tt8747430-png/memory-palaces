import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js'
import { EPOCH, type RemoteChangeEvent } from '@/shared/api'
import type { SyncedTable } from '@/shared/config/sync-tables'
import type { Row } from './document-mapping'

export interface CloudWatcher {
  stop: () => Promise<void>
}

/**
 * One long-lived Realtime subscription for as long as an account is signed in.
 *
 * It used to live inside `createCollectionReplication`, with a random topic so two concurrent
 * replications could not collide. With `live: false` a replication exists only for the length of a
 * cycle, so a channel inside one would be torn down between syncs and miss exactly the events the
 * banner needs. Out here it is a single subscription, so nothing collides and the workaround is
 * gone with it.
 *
 * **It never applies anything.** It reports position — table, id, clock — and the caller decides
 * whether that is genuinely ahead of this device's checkpoint. That is what stops the banner
 * lighting up at the echo of this device's own push: those rows are at or below the checkpoint the
 * Sync that pushed them just wrote.
 */
export function createCloudWatcher(
  supabase: SupabaseClient,
  tables: readonly SyncedTable[],
  userId: string,
  onRemoteChange: (event: RemoteChangeEvent) => void,
): CloudWatcher {
  const channel = supabase.channel(`cloud:${userId}`)

  for (const table of tables) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload: RealtimePostgresChangesPayload<Row>) => {
        const row = payload.new as Row | undefined
        if (!row?.id) return
        onRemoteChange({ table, id: row.id, updated_at: row.updated_at ?? EPOCH })
      },
    )
  }

  channel.subscribe()

  return {
    stop: async () => {
      await supabase.removeChannel(channel)
    },
  }
}
