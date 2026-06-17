import { type FormEvent, useState } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Mail } from 'lucide-react'
import { isEmail } from '@/shared/lib'
import { AuthScreen, AuthField, BrandMark, Button, PasswordField, SocialButtons } from '@/shared/ui'
import { useAuthActions } from '@/features/session'

export interface LoginPageProps {
  onAuthed: () => void
  onGuest: () => void
  onSignup: () => void
  onForgot: () => void
}

/** Sign-in screen. Mock auth (no credential check); also offers a guest door and a
 * route to sign-up / password recovery. Identity persists through the gateway. */
export function LoginPage({ onAuthed, onGuest, onSignup, onForgot }: LoginPageProps) {
  const { t } = useTranslation()
  const actions = useAuthActions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: typeof errors = {}
    if (!email.trim()) next.email = t('auth.errors.emailRequired')
    else if (!isEmail(email)) next.email = t('auth.errors.emailInvalid')
    if (!password) next.password = t('auth.errors.passwordRequired')
    setErrors(next)
    if (next.email || next.password) return

    setBusy(true)
    await actions.signIn(email.trim())
    onAuthed()
  }

  const handleGuest = async () => {
    await actions.continueAsGuest()
    onGuest()
  }

  return (
    <AuthScreen>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-1 flex-col justify-center gap-8 py-10"
      >
        <header className="flex flex-col items-center gap-4 text-center">
          <BrandMark className="size-16" />
          <div className="flex flex-col gap-1">
            <h1 className="text-[length:var(--p-text-headline)] font-semibold text-heading">
              {t('auth.login.title')}
            </h1>
            <p className="text-muted-foreground">{t('auth.login.subtitle')}</p>
          </div>
        </header>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <AuthField
            id="email"
            label={t('auth.emailLabel')}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            icon={<Mail />}
            value={email}
            onValueChange={setEmail}
            valid={isEmail(email)}
            error={errors.email}
          />
          <PasswordField
            id="password"
            label={t('auth.passwordLabel')}
            autoComplete="current-password"
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onValueChange={setPassword}
            error={errors.password}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onForgot}
              className="text-[length:var(--p-text-label)] font-medium text-heading"
            >
              {t('auth.login.forgot')}
            </button>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? t('auth.login.submitting') : t('auth.login.submit')}
          </Button>
        </form>

        <Button variant="ghost" size="lg" className="w-full" onClick={handleGuest}>
          {t('auth.continueAsGuest')}
        </Button>

        <SocialButtons />

        <p className="text-center text-[length:var(--p-text-label)] text-muted-foreground">
          {t('auth.login.noAccount')}{' '}
          <button type="button" onClick={onSignup} className="font-semibold text-heading">
            {t('auth.login.createAccount')}
          </button>
        </p>
      </motion.div>
    </AuthScreen>
  )
}
