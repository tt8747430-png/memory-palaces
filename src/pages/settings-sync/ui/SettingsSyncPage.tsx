import { useTranslation } from 'react-i18next'
import { CloudUpload, ListChecks, RefreshCcwDot, Trash2 } from 'lucide-react'
import {
  AppScreen,
  ConfirmDialog,
  ScreenHeader,
  ScreenLoading,
  SettingsRow,
  SettingsSection,
  Sheet,
} from '@/shared/ui'
import { useSyncSettings } from '../model/use-sync-settings'
import { QuietSection } from './QuietSection'
import { RecentSyncs } from './RecentSyncs'
import { SyncStatusCard } from './SyncStatusCard'
import { WaitingSection } from './WaitingSection'

export interface SettingsSyncPageProps {
  onBack?: () => void
}

export function SettingsSyncPage({ onBack }: SettingsSyncPageProps) {
  const { t } = useTranslation()
  const page = useSyncSettings()

  const header = (
    <ScreenHeader title={t('sync.settings.title')} onBack={onBack} backLabel={t('settings.back')} />
  )

  if (!page.ready) return <ScreenLoading />

  if (!page.runner) {
    return (
      <AppScreen gutter="end" fill header={header}>
        <div className="mt-4 rounded-card bg-info-surface p-4">
          <p className="text-label leading-snug text-info-foreground">
            {t(page.guest ? 'sync.settings.guest' : 'sync.settings.unavailable')}
          </p>
        </div>
      </AppScreen>
    )
  }

  const waitingCount = page.waiting.reduce((total, row) => total + row.count, 0)
  const opened = page.pending?.kind === 'waiting' ? page.pending : null

  return (
    <AppScreen gutter="end" header={header}>
      <div className="mt-4 flex flex-col gap-5">
        <SyncStatusCard
          status={page.status}
          waiting={waitingCount}
          error={page.error}
          lastSyncedAt={page.lastSyncedAt}
          account={page.account}
          online={page.online}
          busy={page.busy}
          onSync={page.sync}
        />

        <WaitingSection rows={page.waiting} onOpen={page.openWaiting} />

        <SettingsSection title={t('sync.settings.autosyncSection')}>
          <SettingsRow
            kind="toggle"
            icon={<CloudUpload />}
            label={t('sync.settings.autosync')}
            description={t('sync.settings.autosyncHint')}
            checked={page.autosync}
            onCheckedChange={page.setAutosync}
          />
        </SettingsSection>

        <QuietSection waiting={page.settingsWaiting} online={page.online} />

        <RecentSyncs log={page.log} />

        <SettingsSection title={t('sync.settings.repair')}>
          <SettingsRow
            kind="action"
            icon={<ListChecks />}
            label={t('sync.settings.reviewPending')}
            description={t('sync.settings.reviewPendingHint')}
            disabled={page.busy}
            onClick={() => void page.review()}
          />
          <SettingsRow
            kind="action"
            icon={<RefreshCcwDot />}
            label={t('sync.settings.checkEverything')}
            description={t('sync.settings.checkEverythingHint')}
            disabled={page.busy || !page.online}
            onClick={page.requestRepair}
          />
        </SettingsSection>
      </div>

      <Sheet
        open={opened !== null}
        onOpenChange={(open) => {
          if (!open) page.dismiss()
        }}
        title={t('sync.settings.waitingSheet', { table: opened?.label ?? '' })}
      >
        <ul className="divide-y divide-border">
          {page.openedItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              {item.op === 'remove' ? (
                <Trash2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <CloudUpload className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate text-body text-heading">{item.label}</span>
            </li>
          ))}
        </ul>
      </Sheet>

      <ConfirmDialog
        open={page.pending?.kind === 'repair'}
        onOpenChange={(open) => {
          if (!open) page.dismiss()
        }}
        icon={<RefreshCcwDot className="size-6" aria-hidden />}
        title={t('sync.settings.checkEverythingTitle')}
        description={t('sync.settings.checkEverythingBody')}
        confirmLabel={t('sync.settings.checkEverythingConfirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void page.repair()}
      />
    </AppScreen>
  )
}
