import { createContext, useContext } from 'react'
import type { AccountDeletionPort } from '@/shared/api'

export const AccountDeletionContext = createContext<AccountDeletionPort | null>(null)

/** Null when no Supabase project is configured — there is then no account to delete. */
export function useAccountDeletion(): AccountDeletionPort | null {
  return useContext(AccountDeletionContext)
}
