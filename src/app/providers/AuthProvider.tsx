import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { readOnline, useAccountDeletion, useAuthGateway, useLatest } from '@/shared/lib'
import { selectAccountId, useSessionStore, useSessionStoreApi } from '@/entities/session'
import { restoreSession } from '@/features/session'
import {
  type ScheduledDeletionCheck,
  ScheduledDeletionContext,
  type ScheduledDeletionState,
} from './scheduled-deletion'

const CHECK_BUDGET_MS = 4000

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
