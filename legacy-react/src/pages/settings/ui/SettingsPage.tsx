import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeftRight,
  CheckSquare,
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  Info,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Shield,
  Sparkles,
  Sun,
  Target,
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
  AppScreen,
  Avatar,
  ConfirmDialog,
  ScreenHeader,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'

export interface SettingsPageProps {
  onBack?: () => void
  onEditProfile?: () => void
  onPrivacy?: () => void
  onSwipe?: () => void
  onSelectToolbar?: () => void
  onHelp?: () => void
  onAbout?: () => void
  onSignIn?: () => void
  onLogout?: () => void
  sessionKind?: SessionKind
}

export function SettingsPage({
  onBack,
  onEditProfile,
  onPrivacy,
  onSwipe,
  onSelectToolbar,
  onHelp,
  onAbout,
  onSignIn,
  onLogout,
  sessionKind = 'account',
}: SettingsPageProps) {
  const { t, i18n } = useTranslation()
  const prefsStore = usePreferencesStoreApi()
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const profileStore = useProfileStoreApi()
  const profile = useProfileStore(selectEffectiveProfile)
  const [logoutOpen, setLogoutOpen] = useState(false)

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
  }
  const languageOptions = AVAILABLE_LANGUAGES.map((language) => ({
    value: language.code,
    label: language.label,
    icon: <Globe className="size-[18px]" aria-hidden />,
  }))

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
          <SettingsRow
            kind="select"
            icon={<Target />}
            label={t('settings.dailyGoal')}
            description={t('settings.dailyGoalHint')}
            value={String(prefs.dailyGoal)}
            options={DAILY_GOAL_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
            onValueChange={(value) => update({ dailyGoal: Number(value) })}
          />
          <SettingsRow
            kind="select"
            icon={<Palette />}
            label={t('settings.theme')}
            description={t('settings.themeHint')}
            value={prefs.theme}
            options={themeOptions.map((option) => ({
              value: option.value,
              label: option.label,
              icon: option.icon,
            }))}
            onValueChange={(value) =>
              update({ theme: value as (typeof themeOptions)[number]['value'] })
            }
          />
          <SettingsRow
            kind="select"
            icon={<Globe />}
            label={t('settings.language')}
            description={t('settings.languageHint')}
            value={currentLanguage.code}
            options={languageOptions}
            onValueChange={selectLanguage}
          />
          <SettingsRow
            kind="nav"
            icon={<ArrowLeftRight />}
            label={t('settings.swipeActions')}
            description={t('settings.swipeActionsHint')}
            onClick={() => onSwipe?.()}
          />
          <SettingsRow
            kind="nav"
            icon={<CheckSquare />}
            label={t('settings.selectToolbar')}
            description={t('settings.selectToolbarHint')}
            onClick={() => onSelectToolbar?.()}
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
