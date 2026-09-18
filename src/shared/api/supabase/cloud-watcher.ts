import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js'
import { EPOCH, type RemoteChangeHandlers } from '@/shared/api'
import type { SyncedTable } from '@/shared/config/sync-tables'
import type { Row } from './document-mapping'

export interface CloudWatcher {
  stop: () => Promise<void>
}

/**
 * One Realtime channel over the account's rows in every live table. It reports positions, never
 * documents: applying anything is a Sync's job. A channel that subscribes a second time has been
 * down in between, and says so — whatever moved meanwhile went unheard.
 */
export function createCloudWatcher(
  supabase: SupabaseClient,
  tables: readonly SyncedTable[],
  userId: string,
  handlers: RemoteChangeHandlers,
): CloudWatcher {
  const channel = supabase.channel(`cloud:${userId}`)

  for (const table of tables) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
      (payload: RealtimePostgresChangesPayload<Row>) => {
        const row = payload.new as Row | undefined
        if (!row?.id) return
        handlers.onChange({ table, id: row.id, updated_at: row.updated_at ?? EPOCH })
      },
    )
  }

  let subscribed = false
  channel.subscribe((status) => {
    if (status !== 'SUBSCRIBED') return
    if (subscribed) handlers.onReconnect()
    subscribed = true
  })

  return {
    stop: async () => {
      await supabase.removeChannel(channel)
    },
  }
}
