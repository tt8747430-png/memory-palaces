import { createContext, useContext } from 'react'

/**
 * Wiping this device's database and reloading.
 *
 * Exposed as a context because exactly one screen needs it — the account deletion request, which
 * wipes the device only *after* a Sync has put everything in the cloud. It is deliberately not on
 * any store: this is not a document write, it is the end of the database.
 */
export const ResetLocalDataContext = createContext<(() => Promise<void>) | null>(null)

export function useResetLocalData(): () => Promise<void> {
  const reset = useContext(ResetLocalDataContext)
  if (!reset) throw new Error('Local data reset missing — render inside <ResetLocalDataContext>')
  return reset
}
