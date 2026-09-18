import { useTranslation } from 'react-i18next'
import { CloudCheck, CloudUpload } from 'lucide-react'
import { SettingsRow, SettingsSection } from '@/shared/ui'
import type { WaitingRow } from '../model/use-sync-settings'

export interface WaitingSectionProps {
  rows: readonly WaitingRow[]
  onOpen: (row: WaitingRow) => void
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
              onClick={() => onOpen(row)}
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
        <SettingsRow kind="info" icon={<CloudCheck />} label={t('sync.settings.nothingWaiting')} />
      )}
    </SettingsSection>
  )
}
