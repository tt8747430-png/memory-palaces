import { useNavigate } from '@tanstack/react-router'
import { SettingsAboutPage } from '@/pages/settings-about'
import { SettingsChangePasswordPage } from '@/pages/settings-change-password'
import { SettingsHelpPage } from '@/pages/settings-help'
import { SettingsPage } from '@/pages/settings'
import { SettingsPrivacyPage } from '@/pages/settings-privacy'
import { SettingsProfilePage } from '@/pages/settings-profile'
import { SettingsSelectPage } from '@/pages/settings-select'
import { SettingsSwipePage } from '@/pages/settings-swipe'
import { useSessionStore } from '@/entities/session'
import { useAuthActions } from '@/features/session'
import { ROUTES } from '@/shared/config/routes'
import { useBackTo } from './use-back'

export function SettingsScreen() {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()
  const sessionKind = useSessionStore((state) => state.session?.kind ?? 'guest')
  return (
    <SettingsPage
      onBack={useBackTo(ROUTES.profile)}
      onEditProfile={() => navigate({ to: ROUTES.settingsProfile })}
      onPrivacy={() => navigate({ to: ROUTES.settingsPrivacy })}
      onSwipe={() => navigate({ to: ROUTES.settingsSwipe })}
      onSelectToolbar={() => navigate({ to: ROUTES.settingsSelect })}
      onHelp={() => navigate({ to: ROUTES.settingsHelp })}
      onAbout={() => navigate({ to: ROUTES.settingsAbout })}
      onSignIn={() => navigate({ to: ROUTES.login })}
      onKitchenSink={() => navigate({ to: ROUTES.devKitchenSink })}
      onLogout={async () => {
        await signOut()
        await navigate({ to: ROUTES.login })
      }}
      sessionKind={sessionKind}
    />
  )
}

export function SettingsProfileScreen() {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()
  return (
    <SettingsProfilePage
      onBack={useBackTo(ROUTES.settings)}
      onChangePassword={() => navigate({ to: ROUTES.settingsChangePassword })}
      onDeleteAccount={async () => {
        await signOut()
        await navigate({ to: ROUTES.login })
      }}
    />
  )
}

export function SettingsChangePasswordScreen() {
  return <SettingsChangePasswordPage onBack={useBackTo(ROUTES.settings)} />
}

export function SettingsPrivacyScreen() {
  return <SettingsPrivacyPage onBack={useBackTo(ROUTES.settings)} />
}

export function SettingsSwipeScreen() {
  return <SettingsSwipePage onBack={useBackTo(ROUTES.settings)} />
}

export function SettingsSelectScreen() {
  return <SettingsSelectPage onBack={useBackTo(ROUTES.settings)} />
}

export function SettingsHelpScreen() {
  return <SettingsHelpPage onBack={useBackTo(ROUTES.settings)} />
}

export function SettingsAboutScreen() {
  return <SettingsAboutPage onBack={useBackTo(ROUTES.settings)} />
}
