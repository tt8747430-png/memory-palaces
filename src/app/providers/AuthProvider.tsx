import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { readOnline, useAccountDeletion, useAuthGateway, useLatest } from '@/shared/lib'
import { selectAccountId, useSessionStore, useSessionStoreApi } from '@/entities/session'
import { restoreSession } from '@/features/session'
import {
  type ScheduledDeletionCheck,
  ScheduledDeletionContext,
  type ScheduledDeletionState,
} from './scheduled-deletion'

/**
 * How long a sign-in waits on the deletion check before the app opens anyway. A working network
 * answers well inside it; a bad one does not get to hold the whole app back.
 */
const CHECK_BUDGET_MS = 4000

/**
 * Restores the session, and owns the moment it becomes an account — which is when a pending account
 * deletion has to be found, on every sign-in path: email, OAuth return, and a session restored at
 * launch.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const gateway = useAuthGateway()
  const sessionStore = useSessionStoreApi()
  const deletion = useAccountDeletion()
  const accountId = useSessionStore(selectAccountId)
  const [check, setCheck] = useState<ScheduledDeletionCheck>({ status: 'clear' })
  const status = useLatest(check.status)

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    let cancelled = false

    void restoreSession({ gateway, sessionStore }).then((stop) => {
      if (cancelled) stop()
      else unsubscribe = stop
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [gateway, sessionStore])

  useEffect(() => {
    if (!deletion || !accountId) {
      setCheck({ status: 'clear' })
      return
    }

    let live = true
    let budget: ReturnType<typeof setTimeout> | undefined

    const run = () => {
      if (!readOnline()) {
        setCheck({ status: 'unknown' })
        return
      }
      setCheck((current) => (current.status === 'unknown' ? current : { status: 'checking' }))
      budget = setTimeout(() => {
        if (live)
          setCheck((current) => (current.status === 'checking' ? { status: 'unknown' } : current))
      }, CHECK_BUDGET_MS)
      void deletion.scheduled().then(
        (found) => {
          if (!live) return
          clearTimeout(budget)
          setCheck(found ? { status: 'scheduled', deletion: found } : { status: 'clear' })
        },
        () => {
          if (!live) return
          clearTimeout(budget)
          setCheck({ status: 'unknown' })
        },
      )
    }

    // Only a check that could not answer is worth repeating; a clear one stays clear.
    const retry = () => {
      if (status.current === 'unknown') run()
    }

    run()
    window.addEventListener('online', retry)
    return () => {
      live = false
      clearTimeout(budget)
      window.removeEventListener('online', retry)
    }
  }, [deletion, accountId, status])

  const cancelled = useCallback(() => setCheck({ status: 'clear' }), [])
  const value = useMemo<ScheduledDeletionState>(() => ({ check, cancelled }), [check, cancelled])

  return <ScheduledDeletionContext value={value}>{children}</ScheduledDeletionContext>
}
