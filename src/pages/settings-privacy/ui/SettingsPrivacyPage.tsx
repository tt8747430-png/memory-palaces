import { type ReactNode, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, Lock, MapPin, Share2, TrendingUp } from 'lucide-react'
import {
  type PrivacySettings,
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'
import { AppScreen, ScreenHeader, SettingsRow, SettingsSection } from '@/shared/ui'

export interface SettingsPrivacyPageProps {
  onBack?: () => void
}

export function SettingsPrivacyPage({ onBack }: SettingsPrivacyPageProps) {
  const { t } = useTranslation()
  const store = usePreferencesStoreApi()
  const prefs = usePreferencesStore(selectEffectivePreferences)

  useEffect(() => {
    store.getState().start()
  }, [store])

  const toggle = (key: keyof PrivacySettings, value: boolean) =>
    void setPreferences(store, { privacy: { ...prefs.privacy, [key]: value } })

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

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader
          title={t('settings.privacyScreen.title')}
          onBack={onBack}
          backLabel={t('settings.back')}
        />
      }
    >
      <div className="mt-4 flex flex-col gap-5 pb-28">
        <div className="rounded-card bg-info-surface p-4">
          <p className="text-[length:var(--p-text-sub)] font-semibold text-info-foreground">
            {t('settings.privacyScreen.bannerTitle')}
          </p>
          <p className="mt-1 text-[length:var(--p-text-label)] leading-snug text-info-foreground/80">
            {t('settings.privacyScreen.bannerBody')}
          </p>
        </div>

        <SettingsSection>
          {rows.map((row) => (
            <SettingsRow
              key={row.key}
              kind="toggle"
              icon={row.icon}
              label={row.label}
              description={row.hint}
              checked={prefs.privacy[row.key]}
              onCheckedChange={(value) => toggle(row.key, value)}
            />
          ))}
        </SettingsSection>
      </div>
    </AppScreen>
  )
}
