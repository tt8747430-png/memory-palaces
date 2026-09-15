import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js'
import { EPOCH, type RemoteChangeEvent } from '@/shared/api'
import type { SyncedTable } from '@/shared/config/sync-tables'
import type { Row } from './document-mapping'

export interface CloudWatcher {
  stop: () => Promise<void>
}

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
