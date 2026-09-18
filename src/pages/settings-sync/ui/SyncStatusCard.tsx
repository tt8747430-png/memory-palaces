import { useTranslation } from 'react-i18next'
import { CloudAlert, CloudCheck, CloudUpload, RefreshCw, WifiOff } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui'
import type { SyncStatus } from '../model/status'
import { relativeTime } from '../model/relative-time'

export interface SyncStatusCardProps {
  status: SyncStatus
  waiting: number
  error: string | null
  lastSyncedAt: string | null
  account: string
  online: boolean
  busy: boolean
  onSync: () => void
}

const TONE: Record<SyncStatus, string> = {
  synced: 'bg-(--success-surface) text-(--success-on-surface)',
  waiting: 'bg-info-surface text-info-foreground',
  syncing: 'bg-info-surface text-info-foreground',
  offline: 'bg-(--warning-surface) text-(--warning-foreground)',
  failed: 'bg-(--danger-surface) text-(--danger-on-surface)',
}

const ICON: Record<SyncStatus, typeof RefreshCw> = {
  synced: CloudCheck,
  waiting: CloudUpload,
  syncing: RefreshCw,
  offline: WifiOff,
  failed: CloudAlert,
}

/** Where this device stands, in one card: the state, when it last synced, as whom, and the button. */
export function SyncStatusCard({
  status,
  waiting,
  error,
  lastSyncedAt,
  account,
  online,
  busy,
  onSync,
}: SyncStatusCardProps) {
  const { t } = useTranslation()
  const Icon = ICON[status]
  return (
    <section
      aria-live="polite"
      className="flex flex-col gap-4 rounded-card border border-border bg-card p-4 shadow-rest"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-control [&_svg]:size-5',
            TONE[status],
          )}
        >
          <Icon className={cn(status === 'syncing' && 'motion-safe:animate-spin')} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-title font-semibold text-heading">
            {t(`sync.settings.status.${status}`, { count: waiting })}
          </p>
          {status === 'failed' && error ? (
            <p className="mt-0.5 text-label leading-snug text-(--danger-on-surface)">{error}</p>
          ) : null}
          <p className="mt-1 text-label leading-snug text-muted-foreground">
            {lastSyncedAt
              ? t('sync.settings.lastSynced', { when: relativeTime(lastSyncedAt, Date.now()) })
              : t('sync.settings.lastSyncedNever')}
          </p>
          {account ? (
            <p className="text-label leading-snug text-muted-foreground">
              {t('sync.settings.account', { name: account })}
            </p>
          ) : null}
        </div>
      </div>
      <Button
        size="lg"
        className="w-full"
        disabled={busy || !online}
        onClick={onSync}
        aria-describedby={online ? undefined : 'sync-offline-note'}
      >
        <RefreshCw className="size-4.5" aria-hidden />
        {t('sync.settings.syncNow')}
      </Button>
      {online ? null : (
        <p id="sync-offline-note" className="-mt-2 text-center text-label text-muted-foreground">
          {t('sync.settings.syncNowOffline')}
        </p>
      )}
    </section>
  )
}
