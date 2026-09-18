import { useTranslation } from 'react-i18next'
import { CloudUpload } from 'lucide-react'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { SettingsRow, SettingsSection } from '@/shared/ui'
import type { WaitingRow } from '../model/use-sync-settings'

export interface WaitingSectionProps {
  rows: readonly WaitingRow[]
  onOpen: (table: SyncedTable) => void
}

/** What has not left this device yet, one row per table — a content row opens the list. */
export function WaitingSection({ rows, onOpen }: WaitingSectionProps) {
  const { t } = useTranslation()
  return (
    <SettingsSection title={t('sync.settings.waiting')}>
      {rows.length ? (
        rows.map((row) =>
          row.openable ? (
            <SettingsRow
              key={row.table}
              kind="nav"
              icon={<CloudUpload />}
              label={row.label}
              value={String(row.count)}
              onClick={() => onOpen(row.table)}
            />
          ) : (
            <SettingsRow
              key={row.table}
              kind="value"
              icon={<CloudUpload />}
              label={row.label}
              value={String(row.count)}
            />
          ),
        )
      ) : (
        <SettingsRow
          kind="value"
          icon={<CloudUpload />}
          label={t('sync.settings.nothingWaiting')}
          value=""
        />
      )}
    </SettingsSection>
  )
}
