import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, Lock, MapPin, Share2, TrendingUp } from 'lucide-react'
import { type PrivacySettings, usePreferencesStore } from '@/entities/preferences'
import { selectIsReady } from '@/shared/lib'
import { AppScreen, ScreenHeader, ScreenLoading, SettingsRow, SettingsSection } from '@/shared/ui'

export interface SettingsPrivacyPageProps {
  onBack?: () => void
}

export function SettingsPrivacyPage({ onBack }: SettingsPrivacyPageProps) {
  const { t } = useTranslation()
  const ready = usePreferencesStore(selectIsReady)

  const rows: { key: keyof PrivacySettings; icon: ReactNode; label: string; hint: string }[] = [
    {
      key: 'profileVisibility',
      icon: <Eye />,
      label: t('settings.privacyScreen.profileVisibility'),
      hint: t('settings.privacyScreen.profileVisibilityHint'),
    },
    {
      key: 'activitySharing',
      icon: <Share2 />,
      label: t('settings.privacyScreen.activitySharing'),
      hint: t('settings.privacyScreen.activitySharingHint'),
    },
    {
      key: 'locationAccess',
      icon: <MapPin />,
      label: t('settings.privacyScreen.locationAccess'),
      hint: t('settings.privacyScreen.locationAccessHint'),
    },
    {
      key: 'notificationTracking',
      icon: <TrendingUp />,
      label: t('settings.privacyScreen.notificationTracking'),
      hint: t('settings.privacyScreen.notificationTrackingHint'),
    },
    {
      key: 'dataEncryption',
      icon: <Lock />,
      label: t('settings.privacyScreen.dataEncryption'),
      hint: t('settings.privacyScreen.dataEncryptionHint'),
    },
  ]

  if (!ready) return <ScreenLoading />

  return (
    <AppScreen
      gutter="end"
      fill
      header={
        <ScreenHeader
          title={t('settings.privacyScreen.title')}
          onBack={onBack}
          backLabel={t('settings.back')}
        />
      }
    >
      <div className="mt-4 flex flex-col gap-5">
        <div className="rounded-card bg-info-surface p-4">
          <p className="text-body font-semibold text-info-foreground">
            {t('settings.privacyScreen.bannerTitle')}
          </p>
          <p className="mt-1 text-label leading-snug text-info-foreground/80">
            {t('settings.privacyScreen.bannerBody')}
          </p>
        </div>

        <SettingsSection>
          {rows.map((row) => (
            <SettingsRow
              key={row.key}
              kind="soon"
              icon={row.icon}
              label={row.label}
              description={row.hint}
              badge={t('settings.comingSoon')}
            />
          ))}
        </SettingsSection>
      </div>
    </AppScreen>
  )
}
