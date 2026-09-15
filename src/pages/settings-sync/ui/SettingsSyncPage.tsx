import { useMemo } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { CloudUpload, ListChecks, RefreshCw } from 'lucide-react'
import { CONTENT_COLLECTIONS } from '@/shared/config/sync-tables'
import { selectIsReady, useOnline, useSyncRunner } from '@/shared/lib'
import { AppScreen, ScreenHeader, ScreenLoading, SettingsRow, SettingsSection } from '@/shared/ui'
import { selectSessionKind, useSessionStore } from '@/entities/session'
import {
  pendingByCollection,
  selectPendingChanges,
  usePendingChangeStore,
} from '@/entities/pending-change'
import {
  selectLastSyncedAt,
  useSyncStateStore,
  useSyncStateStoreApi,
  selectAutosync,
} from '@/entities/sync-state'
import { setAutosync } from '@/features/sync'
import { SyncBanner } from '@/widgets/sync'
import { relativeTime } from '../model/relative-time'

export interface SettingsSyncPageProps {
  onBack?: () => void
}

export function SettingsSyncPage({ onBack }: SettingsSyncPageProps) {
  const { t } = useTranslation()
  const runner = useSyncRunner()
  const online = useOnline()
  const kind = useSessionStore(selectSessionKind)
  const ready = useSyncStateStore(selectIsReady)
  const changes = usePendingChangeStore(selectPendingChanges)
  const lastSyncedAt = useSyncStateStore(selectLastSyncedAt)
  const autosync = useSyncStateStore(selectAutosync)
  const syncStateStore = useSyncStateStoreApi()

  const counts = useMemo(() => pendingByCollection(changes), [changes])

  const header = (
    <ScreenHeader title={t('sync.settings.title')} onBack={onBack} backLabel={t('settings.back')} />
  )

  if (!ready) return <ScreenLoading />

  if (!runner) {
    return (
      <AppScreen gutter="end" fill header={header}>
        <div className="mt-4 rounded-card bg-info-surface p-4">
          <p className="text-label leading-snug text-info-foreground">
            {t(kind === 'guest' ? 'sync.settings.guest' : 'sync.settings.unavailable')}
          </p>
        </div>
      </AppScreen>
    )
  }

  const busy = runner.phase === 'syncing' || runner.phase === 'restoring'

  const reviewPending = async () => {
    const outcome = await runner.openReview()
    switch (outcome.kind) {
      case 'needs-review':
        return
      case 'clean':
      case 'merged':
        toast(t('sync.settings.nothingToReview'))
        return
      case 'offline':
        toast.error(t('common.offline'))
        return
      case 'failed':
        toast.error(t('sync.settings.reviewFailed'))
        return
    }
  }

  return (
    <AppScreen gutter="end" fill header={header}>
      <SyncBanner className="mt-2" />

      <div className="mt-4 flex flex-col gap-5">
        <p className="text-label leading-snug text-muted-foreground">
          {lastSyncedAt
            ? t('sync.settings.lastSynced', { when: relativeTime(lastSyncedAt, Date.now()) })
            : t('sync.settings.lastSyncedNever')}
        </p>

        <SettingsSection title={t('sync.settings.waiting')}>
          {changes.length ? (
            CONTENT_COLLECTIONS.filter((collection) => counts[collection] > 0).map((collection) => (
              <SettingsRow
                key={collection}
                kind="value"
                icon={<CloudUpload />}
                label={t(`sync.review.group.${collection}`, { count: counts[collection] })}
                value={t(`sync.settings.counts.${collection}`, { count: counts[collection] })}
              />
            ))
          ) : (
            <SettingsRow
              kind="value"
              icon={<CloudUpload />}
              label={t('sync.settings.nothingWaiting')}
              value=""
            />
          )}
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            kind="action"
            icon={<RefreshCw />}
            label={t('sync.settings.syncNow')}
            description={online ? undefined : t('sync.settings.syncNowOffline')}
            disabled={busy || !online}
            onClick={() => void runner.run()}
          />
          <SettingsRow
            kind="action"
            icon={<ListChecks />}
            label={t('sync.settings.reviewPending')}
            description={t('sync.settings.reviewPendingHint')}
            disabled={busy}
            onClick={() => void reviewPending()}
          />
          <SettingsRow
            kind="toggle"
            icon={<CloudUpload />}
            label={t('sync.settings.autosync')}
            description={t('sync.settings.autosyncHint')}
            checked={autosync}
            onCheckedChange={(value) => void setAutosync({ syncStateStore }, value)}
          />
        </SettingsSection>
      </div>
    </AppScreen>
  )
}
