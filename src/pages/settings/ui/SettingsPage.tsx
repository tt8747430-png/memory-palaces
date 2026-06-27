import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  Check,
  ChevronRight,
  Download,
  Globe,
  HelpCircle,
  Info,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Vibrate,
  Volume2,
} from 'lucide-react'
import {
  type PreferencesChanges,
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import {
  profileHandle,
  selectEffectiveProfile,
  useProfileStore,
  useProfileStoreApi,
} from '@/entities/profile'
import type { SessionKind } from '@/entities/session'
import { setPreferences } from '@/features/preferences'
import { AVAILABLE_LANGUAGES, DAILY_GOAL_OPTIONS } from '@/shared/config/constants'
import {
  ActionSheet,
  AppScreen,
  Avatar,
  ConfirmDialog,
  ScreenHeader,
  SegmentedControl,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'

export interface SettingsPageProps {
  /** All provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
  onEditProfile?: () => void
  onPrivacy?: () => void
  /** Open the destructive Clear data screen. */
  onClearData?: () => void
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
  onClearData,
  onHelp,
  onAbout,
  onExport,
  onImportFile,
  onSignIn,
  onLogout,
  sessionKind = 'account',
}: SettingsPageProps) {
  const { t, i18n } = useTranslation()
  const prefsStore = usePreferencesStoreApi()
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const profileStore = useProfileStoreApi()
  const profile = useProfileStore(selectEffectiveProfile)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)

  useEffect(() => {
    prefsStore.getState().start()
    profileStore.getState().start()
  }, [prefsStore, profileStore])

  const update = (changes: PreferencesChanges) => void setPreferences(prefsStore, changes)
  const name = profile.name.trim() || t('settings.namePlaceholder')
  const handle = profileHandle(profile)
  const isGuest = sessionKind === 'guest'

  const themeOptions = [
    {
      value: 'light',
      icon: <Sun className="size-4" aria-hidden />,
      label: t('settings.themeLight'),
    },
    {
      value: 'dark',
      icon: <Moon className="size-4" aria-hidden />,
      label: t('settings.themeDark'),
    },
    {
      value: 'system',
      icon: <Monitor className="size-4" aria-hidden />,
      label: t('settings.themeSystem'),
    },
  ] as const

  const currentLanguage =
    AVAILABLE_LANGUAGES.find((language) => language.code === prefs.language) ??
    AVAILABLE_LANGUAGES[0]!
  const selectLanguage = (code: string) => {
    void i18n.changeLanguage(code)
    update({ language: code })
    setLanguageOpen(false)
  }
  const languageActions = AVAILABLE_LANGUAGES.map((language) => ({
    id: language.code,
    label: language.label,
    icon:
      language.code === currentLanguage.code ? (
        <Check className="size-5 text-primary" aria-hidden />
      ) : (
        <Globe className="size-5 text-accent" aria-hidden />
      ),
    onSelect: () => selectLanguage(language.code),
  }))

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onImportFile?.(file)
    event.target.value = ''
  }

  return (
    <AppScreen
      header={
        <ScreenHeader title={t('settings.title')} onBack={onBack} backLabel={t('settings.back')} />
      }
    >
      <div className="mt-4 flex flex-col gap-5 pb-28">
        <button
          type="button"
          onClick={() => onEditProfile?.()}
          className="group flex w-full items-center gap-4 rounded-card bg-card p-4 text-left shadow-rest transition-[transform,background-color] duration-200 ease-out active:scale-[0.99] active:bg-primary/[0.04]"
        >
          <Avatar
            name={name}
            src={profile.avatar}
            className="size-16 text-xl shadow-rest transition-transform duration-200 ease-out group-active:scale-[0.96]"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[length:var(--p-text-title)] font-semibold text-heading">
              {name}
            </span>
            <span className="block truncate text-[length:var(--p-text-sub)] text-muted-foreground">
              {handle ? `@${handle}` : t('settings.profileHint')}
            </span>
          </span>
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-active:translate-x-0.5"
            aria-hidden
          />
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
          <div className="px-4 py-3">
            <p className="text-[length:var(--p-text-body)] font-semibold text-heading">
              {t('settings.dailyGoal')}
            </p>
            <p className="mb-2.5 text-[length:var(--p-text-label)] text-muted-foreground">
              {t('settings.dailyGoalHint')}
            </p>
            <SegmentedControl
              aria-label={t('settings.dailyGoal')}
              value={String(prefs.dailyGoal)}
              onChange={(value) => update({ dailyGoal: Number(value) })}
              options={DAILY_GOAL_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
            />
          </div>
          <div className="px-4 py-3">
            <p className="text-[length:var(--p-text-body)] font-semibold text-heading">
              {t('settings.theme')}
            </p>
            <p className="mb-2.5 text-[length:var(--p-text-label)] text-muted-foreground">
              {t('settings.themeHint')}
            </p>
            <SegmentedControl
              aria-label={t('settings.theme')}
              value={prefs.theme}
              onChange={(value) => update({ theme: value })}
              options={themeOptions.map((option) => ({
                value: option.value,
                ariaLabel: option.label,
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    {option.icon}
                    {option.label}
                  </span>
                ),
              }))}
            />
          </div>
          <SettingsRow
            kind="nav"
            icon={<Globe />}
            label={t('settings.language')}
            value={currentLanguage.label}
            onClick={() => setLanguageOpen(true)}
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
            description={t('settings.exportProgressHint')}
            onClick={() => onExport?.()}
          />
          <SettingsRow
            kind="nav"
            icon={<Upload />}
            label={t('settings.importProgress')}
            description={t('settings.importProgressHint')}
            onClick={() => importInputRef.current?.click()}
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

        <SettingsSection title={t('settings.supportSection')}>
          <SettingsRow
            kind="nav"
            icon={<HelpCircle />}
            label={t('settings.helpCenter')}
            onClick={() => onHelp?.()}
          />
          <SettingsRow
            kind="nav"
            icon={<Info />}
            label={t('settings.about')}
            onClick={() => onAbout?.()}
          />
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
        open={languageOpen}
        onOpenChange={setLanguageOpen}
        title={t('settings.language')}
        actions={languageActions}
        cancelLabel={t('common.cancel')}
      />

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        icon={<LogOut className="size-6" aria-hidden />}
        title={t('settings.signOutConfirmTitle')}
        description={t('settings.signOutConfirmBody')}
        confirmLabel={t('settings.signOutConfirmCta')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => onLogout?.()}
      />
    </AppScreen>
  )
}
