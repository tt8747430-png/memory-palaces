import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  ChevronRight,
  Download,
  Globe,
  HelpCircle,
  Info,
  LogIn,
  LogOut,
  Moon,
  Shield,
  Sparkles,
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
import type { SessionKind } from '@/entities/session'
import { setPreferences } from '@/features/preferences'
import { ActionSheet, AppScreen, Avatar, ScreenHeader, SettingsRow, SettingsSection } from '@/shared/ui'

export interface SettingsPageProps {
  /** All provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
  onEditProfile?: () => void
  onPrivacy?: () => void
  onHelp?: () => void
  onAbout?: () => void
  onExport?: () => void
  onImportFile?: (file: File) => void
  onSignIn?: () => void
  /** Sign out and return to login (the route owns auth + navigation). Confirmed here. */
  onLogout?: () => void
  /** A guest sees a sign-in CTA; account editing lives on the Profile screen. */
  sessionKind?: SessionKind
}

/** Settings hub — a profile hero (which opens the consolidated Profile screen) over
 * grouped sections: preferences, privacy, data, and support, then Log out at the
 * bottom. Preference toggles persist immediately; navigation, export, and import are
 * handled by the route wrapper. Guests get a sign-in CTA instead of logout; account
 * editing (email, password, phone, delete) lives on the Profile screen. */
export function SettingsPage({
  onBack,
  onEditProfile,
  onPrivacy,
  onHelp,
  onAbout,
  onExport,
  onImportFile,
  onSignIn,
  onLogout,
  sessionKind = 'account',
}: SettingsPageProps) {
  const { t } = useTranslation()
  const prefsStore = usePreferencesStoreApi()
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const profileStore = useProfileStoreApi()
  const profile = useProfileStore(selectEffectiveProfile)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [logoutOpen, setLogoutOpen] = useState(false)

  useEffect(() => {
    prefsStore.getState().start()
    profileStore.getState().start()
  }, [prefsStore, profileStore])

  const update = (changes: PreferencesChanges) => void setPreferences(prefsStore, changes)
  const name = profile.name.trim() || t('settings.namePlaceholder')
  const handle = profileHandle(profile)
  const comingSoon = t('settings.comingSoon')
  const isGuest = sessionKind === 'guest'

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

        {isGuest ? (
          <SettingsSection>
            <SettingsRow
              kind="nav"
              icon={<LogIn />}
              label={t('settings.guestCtaTitle')}
              description={t('settings.guestCtaHint')}
              onClick={() => onSignIn?.()}
            />
          </SettingsSection>
        ) : null}

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

        {isGuest ? null : (
          <SettingsSection>
            <SettingsRow
              kind="nav"
              tone="danger"
              icon={<LogOut />}
              label={t('settings.signOut')}
              onClick={() => setLogoutOpen(true)}
            />
          </SettingsSection>
        )}
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImport}
      />

      <ActionSheet
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title={t('settings.signOutConfirmTitle')}
        description={t('settings.signOutConfirmBody')}
        actions={[
          {
            id: 'logout',
            label: t('settings.signOutConfirmCta'),
            icon: <LogOut className="size-[18px]" aria-hidden />,
            onSelect: () => onLogout?.(),
          },
        ]}
        cancelLabel={t('common.cancel')}
      />
    </AppScreen>
  )
}
