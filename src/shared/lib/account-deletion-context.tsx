import { createContext, useContext } from 'react'
import type { AccountDeletionPort } from '@/shared/api'

export const AccountDeletionContext = createContext<AccountDeletionPort | null>(null)

export function useAccountDeletion(): AccountDeletionPort | null {
  return useContext(AccountDeletionContext)
}
