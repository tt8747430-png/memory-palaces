import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { longDate, useAccountDeletion, useOnline, useSyncRunner } from '@/shared/lib'
import { Button, Curtain, Empty, OfflineNotice, Skeleton } from '@/shared/ui'
import { useAuthActions } from '@/features/session'
import { cancelAccountDeletion } from '@/features/account'
import { useScheduledDeletion } from './scheduled-deletion'

/**
 * What stands between a session and the app while `AuthProvider`'s deletion check is out, and once
 * it has found a scheduled deletion.
 *
 * Rendered inside the sync provider because cancelling forces a Sync, and outside the router
 * because an account on its way to being destroyed is not a state to browse decks in: the two
 * things worth doing — cancel, or leave — are the only two offered. Cancelling is the server's to
 * answer now (ADR 0004), so offline it is said before the press, not failed after it.
 */
export function ScheduledDeletionGate({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { check, cancelled } = useScheduledDeletion()
  const deletion = useAccountDeletion()
  const runner = useSyncRunner()
  const online = useOnline()
  const { signOut } = useAuthActions()
  const [busy, setBusy] = useState(false)

  if (check.status === 'checking') {
    return (
      <Curtain role="status" aria-label={t('account.checking')}>
        <Skeleton className="size-8 bg-secondary" />
      </Curtain>
    )
  }

  if (check.status !== 'scheduled') return children

  const cancel = async () => {
    if (!deletion || !runner) return
    setBusy(true)
    try {
      await cancelAccountDeletion({ deletion, restore: runner.restore })
      // Open the app now, with the restore still running, so its banner is on screen.
      cancelled()
    } catch {
      toast.error(t('account.cancelFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Curtain role="alert">
      <Empty
        variant="hero"
        icon={<AlertTriangle className="size-7" aria-hidden />}
        title={t('account.scheduledTitle')}
        description={t('account.scheduledBody', {
          date: longDate(check.deletion.purgeAfter, i18n.language),
        })}
        action={
          <div className="flex w-full flex-col gap-2">
            <OfflineNotice message={t('account.cancelOffline')} className="text-left" />
            <Button
              size="lg"
              className="w-full"
              disabled={busy || !online}
              onClick={() => void cancel()}
            >
              {busy ? t('account.cancelling') : t('account.cancelDeletion')}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full"
              disabled={busy}
              onClick={() => void signOut()}
            >
              {t('account.signOut')}
            </Button>
          </div>
        }
      />
    </Curtain>
  )
}
