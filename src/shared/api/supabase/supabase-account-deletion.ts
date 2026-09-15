import type { SupabaseClient } from '@supabase/supabase-js'
import type { AccountDeletionPort, ScheduledDeletion } from '@/shared/api'

interface DeletionRow {
  requested_at: string
  purge_after: string
}

const toScheduled = (row: DeletionRow): ScheduledDeletion => ({
  requestedAt: row.requested_at,
  purgeAfter: row.purge_after,
})

export class SupabaseAccountDeletion implements AccountDeletionPort {
  constructor(private readonly client: SupabaseClient) {}

  async scheduled(): Promise<ScheduledDeletion | null> {
    const { data, error } = await this.client
      .from('account_deletions')
      .select('requested_at,purge_after')
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toScheduled(data as DeletionRow) : null
  }

  async request(): Promise<ScheduledDeletion> {
    const { data, error } = await this.client.functions.invoke<{
      requestedAt: string
      purgeAfter: string
    }>('request-account-deletion', { body: {} })
    if (error) throw new Error(error.message)
    if (!data?.purgeAfter) throw new Error('request-account-deletion returned no schedule')
    return { requestedAt: data.requestedAt, purgeAfter: data.purgeAfter }
  }

  async cancel(): Promise<void> {
    const { data: user } = await this.client.auth.getUser()
    const userId = user.user?.id
    if (!userId) throw new Error('Not signed in')
    const { error } = await this.client.from('account_deletions').delete().eq('user_id', userId)
    if (error) throw new Error(error.message)
  }
}
