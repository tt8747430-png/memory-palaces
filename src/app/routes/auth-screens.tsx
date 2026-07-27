import { useNavigate } from '@tanstack/react-router'
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

export function WelcomeScreen() {
  const navigate = useNavigate()
  return <WelcomePage onContinue={() => navigate({ to: ROUTES.home })} />
}
