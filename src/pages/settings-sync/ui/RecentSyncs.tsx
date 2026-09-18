import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import { SettingsSection } from '@/shared/ui'
import type { SyncLogEntry, SyncLogOutcome } from '@/entities/sync-state'
import { relativeTime } from '../model/relative-time'

const TONE: Record<SyncLogOutcome, string> = {
  clean: 'text-(--success-on-surface)',
  merged: 'text-(--success-on-surface)',
  'needs-review': 'text-(--warning-foreground)',
  failed: 'text-(--danger-on-surface)',
}

/** The last few Syncs this device ran — so "did it sync?" is answered here, not guessed. */
export function RecentSyncs({ log }: { log: readonly SyncLogEntry[] }) {
  const { t } = useTranslation()
  const now = Date.now()
  return (
    <SettingsSection title={t('sync.settings.recent')}>
      {log.length ? (
        <ol>
          {log.map((entry) => (
            <li key={entry.at} className="flex items-baseline gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className={cn('block text-body font-semibold', TONE[entry.outcome])}>
                  {t(`sync.settings.outcome.${entry.outcome}`)}
                </span>
                {entry.reason ? (
                  <span className="block truncate text-label text-muted-foreground">
                    {entry.reason}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-label tabular-nums text-muted-foreground">
                {t('sync.settings.moved', { pushed: entry.pushed, pulled: entry.pulled })}
              </span>
              <span className="shrink-0 text-label text-muted-foreground">
                {relativeTime(entry.at, now)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-4 py-3 text-label text-muted-foreground">
          {t('sync.settings.recentEmpty')}
        </p>
      )}
    </SettingsSection>
  )
}
