import { createContext, useContext } from 'react'

export const ResetLocalDataContext = createContext<(() => Promise<void>) | null>(null)

export function useResetLocalData(): () => Promise<void> {
  const reset = useContext(ResetLocalDataContext)
  if (!reset) throw new Error('Local data reset missing — render inside <ResetLocalDataContext>')
  return reset
}
