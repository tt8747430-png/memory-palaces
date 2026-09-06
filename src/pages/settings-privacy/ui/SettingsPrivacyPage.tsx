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

  // `selectEffectivePreferences` answers `DEFAULT_PREFERENCES` until the snapshot lands, so
  // without this every control on this screen paints its default first and then flips — a learner
  // with haptics off watches the switch turn itself on and back off on every cold start.
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

        {/* Nothing reads `prefs.privacy`: `grep -rn "prefs.privacy"` finds one writer and no
            reader, so every one of these was a switch over a feature that does not exist. The
            banner below already hedged, but a switch rendered *on* is a stronger claim than a
            hedge — "Data encryption" sat enabled over an unencrypted IndexedDB store. They stay
            visible because the screen is planned; they stop being switches until it is built. */}
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
