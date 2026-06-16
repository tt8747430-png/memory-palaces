import { useEffect, useRef, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  ChevronRight,
  Download,
  Globe,
  HelpCircle,
  Info,
  Lock,
  Mail,
  Moon,
  Shield,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  Vibrate,
  Volume2,
} from 'lucide-react'
import {
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
  type PreferencesChanges,
} from '@/entities/preferences'
import {
  profileHandle,
  selectEffectiveProfile,
  useProfileStore,
  useProfileStoreApi,
} from '@/entities/profile'
import { setPreferences } from '@/features/preferences'
import { AppScreen, Avatar, ScreenHeader, SettingsRow, SettingsSection } from '@/shared/ui'

export interface SettingsPageProps {
  /** All provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
  onEditProfile?: () => void
  onPrivacy?: () => void
  onClearData?: () => void
  onHelp?: () => void
  onAbout?: () => void
  onExport?: () => void
  onImportFile?: (file: File) => void
}

/** Settings hub — a profile hero over grouped sections (account, preferences, privacy,
 * data, support). Preference toggles persist immediately; navigation, export, and
 * import are handled by the route wrapper; auth-bound rows show a "coming soon" badge. */
export function SettingsPage({
  onBack,
  onEditProfile,
  onPrivacy,
  onClearData,
  onHelp,
  onAbout,
  onExport,
  onImportFile,
}: SettingsPageProps) {
  const { t } = useTranslation()
  const prefsStore = usePreferencesStoreApi()
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const profileStore = useProfileStoreApi()
  const profile = useProfileStore(selectEffectiveProfile)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    prefsStore.getState().start()
    profileStore.getState().start()
  }, [prefsStore, profileStore])

  const update = (changes: PreferencesChanges) => void setPreferences(prefsStore, changes)
  const name = profile.name.trim() || t('settings.namePlaceholder')
  const handle = profileHandle(profile)
  const comingSoon = t('settings.comingSoon')

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onImportFile?.(file)
    event.target.value = ''
  }

  return (
    <AppScreen className="pt-safe">
      <ScreenHeader title={t('settings.title')} onBack={onBack} backLabel={t('settings.back')} />

      <div className="mt-4 flex flex-col gap-5 pb-28">
        <button
          type="button"
          onClick={() => onEditProfile?.()}
          className="flex w-full items-center gap-4 rounded-card bg-card p-4 text-left shadow-rest transition-colors active:bg-primary/[0.04]"
        >
          <Avatar name={name} src={profile.avatar} className="size-16 text-xl shadow-rest" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[length:var(--p-text-title)] font-semibold text-heading">
              {name}
            </span>
            <span className="block truncate text-[length:var(--p-text-sub)] text-muted-foreground">
              {handle ? `@${handle}` : t('settings.profileHint')}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </button>

        <SettingsSection title={t('settings.accountSection')}>
          <SettingsRow
            kind="value"
            icon={<Mail />}
            label={t('settings.email')}
            value={profile.email || t('settings.notSet')}
          />
          <SettingsRow kind="soon" icon={<Lock />} label={t('settings.changePassword')} badge={comingSoon} />
          <SettingsRow kind="soon" icon={<Smartphone />} label={t('settings.phone')} badge={comingSoon} />
        </SettingsSection>

        <SettingsSection title={t('settings.preferencesSection')}>
          <SettingsRow
            kind="toggle"
            icon={<Bell />}
            label={t('settings.notifications')}
            description={t('settings.notificationsHint')}
            checked={prefs.notifications}
            onCheckedChange={(value) => update({ notifications: value })}
          />
          <SettingsRow
            kind="toggle"
            icon={<Volume2 />}
            label={t('settings.sound')}
            description={t('settings.soundHint')}
            checked={prefs.soundEffects}
            onCheckedChange={(value) => update({ soundEffects: value })}
          />
          <SettingsRow
            kind="toggle"
            icon={<Vibrate />}
            label={t('settings.haptics')}
            description={t('settings.hapticsHint')}
            checked={prefs.haptics}
            onCheckedChange={(value) => update({ haptics: value })}
          />
          <SettingsRow
            kind="toggle"
            icon={<Sparkles />}
            label={t('settings.reducedMotion')}
            description={t('settings.reducedMotionHint')}
            checked={prefs.reducedMotion}
            onCheckedChange={(value) => update({ reducedMotion: value })}
          />
          <SettingsRow
            kind="soon"
            icon={<Moon />}
            label={t('settings.darkMode')}
            description={t('settings.darkModeHint')}
            badge={comingSoon}
          />
          <SettingsRow
            kind="value"
            icon={<Globe />}
            label={t('settings.language')}
            value={t('settings.languageValue')}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.privacySection')}>
          <SettingsRow
            kind="nav"
            icon={<Shield />}
            label={t('settings.privacy')}
            onClick={() => onPrivacy?.()}
          />
          <SettingsRow
            kind="nav"
            tone="danger"
            icon={<Trash2 />}
            label={t('settings.clearData')}
            description={t('settings.clearDataHint')}
            onClick={() => onClearData?.()}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.dataSection')}>
          <SettingsRow
            kind="nav"
            icon={<Download />}
            label={t('settings.exportProgress')}
            onClick={() => onExport?.()}
          />
          <SettingsRow
            kind="nav"
            icon={<Upload />}
            label={t('settings.importProgress')}
            onClick={() => importInputRef.current?.click()}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.supportSection')}>
          <SettingsRow
            kind="nav"
            icon={<HelpCircle />}
            label={t('settings.helpCenter')}
            onClick={() => onHelp?.()}
          />
          <SettingsRow kind="nav" icon={<Info />} label={t('settings.about')} onClick={() => onAbout?.()} />
        </SettingsSection>
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImport}
      />
    </AppScreen>
  )
}
