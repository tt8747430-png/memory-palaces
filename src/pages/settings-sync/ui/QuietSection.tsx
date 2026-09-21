import { useTranslation } from 'react-i18next'
import { CloudCheck, WifiOff } from 'lucide-react'
import { SettingsRow, SettingsSection } from '@/shared/ui'

export interface QuietSectionProps {
  /** How many settings and profile changes have not gone up yet. */
  waiting: number
  online: boolean
}

/**
 * States the quiet rule in the learner's words: their settings and profile are not something they
 * have to send. There is no action here on purpose — offering one would suggest the rest needs
 * asking for too.
 */
export function QuietSection({ waiting, online }: QuietSectionProps) {
  const { t } = useTranslation()
  const stranded = waiting > 0 && !online
  return (
    <SettingsSection title={t('sync.settings.quiet.title')}>
      <SettingsRow
        kind="info"
        icon={stranded ? <WifiOff /> : <CloudCheck />}
        label={t('sync.settings.quiet.label')}
        description={
          stranded
            ? t('sync.settings.quiet.offline', { count: waiting })
            : t('sync.settings.quiet.hint')
        }
      />
    </SettingsSection>
  )
}
