import { useNavigate } from '@tanstack/react-router'
import { useSessionStore } from '@/entities/session'
import { AuthCallbackPage } from '@/pages/auth-callback'
import { ForgotPasswordPage } from '@/pages/forgot-password'
import { LoginPage } from '@/pages/login'
import { SignupPage } from '@/pages/signup'
import { WelcomePage } from '@/pages/welcome'
import { ROUTES } from '@/shared/config/routes'
import { useBackTo } from './use-back'

export function LoginScreen() {
  const navigate = useNavigate()
  return (
    <LoginPage
      onAuthed={() => navigate({ to: ROUTES.home })}
      onGuest={() => navigate({ to: ROUTES.home })}
      onSignup={() => navigate({ to: ROUTES.signup })}
      onForgot={() => navigate({ to: ROUTES.forgot })}
    />
  )
}

export function SignupScreen() {
  const navigate = useNavigate()
  return (
    <SignupPage
      onSuccess={() => navigate({ to: ROUTES.welcome })}
      onGuest={() => navigate({ to: ROUTES.home })}
      onLogin={() => navigate({ to: ROUTES.login })}
    />
  )
}

export function ForgotScreen() {
  return <ForgotPasswordPage onBack={useBackTo(ROUTES.login)} />
}

export function AuthCallbackScreen() {
  const navigate = useNavigate()
  // AuthProvider already mirrors the gateway into the session store, so an account landing here is
  // the signal that the OAuth exchange completed.
  const isAccount = useSessionStore((state) => state.session?.kind === 'account')
  return (
    <AuthCallbackPage
      sessionReady={isAccount}
      onDone={(next) =>
        next === 'recovery'
          ? navigate({
              to: ROUTES.settingsChangePassword,
              search: { recovery: true },
              replace: true,
            })
          : navigate({ to: ROUTES.home, replace: true })
      }
      onCancel={() => navigate({ to: ROUTES.login, replace: true })}
    />
  )
}

export function WelcomeScreen() {
  const navigate = useNavigate()
  return <WelcomePage onContinue={() => navigate({ to: ROUTES.home })} />
}
