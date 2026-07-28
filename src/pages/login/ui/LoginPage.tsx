import { type SyntheticEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isEmail } from '@/shared/lib'
import { EmailField, PasswordField } from '@/shared/ui'
import { AuthForm } from '@/widgets/threshold'
import { useAuthActions } from '@/features/session'

export interface LoginPageProps {
  onAuthed: () => void
  onGuest: () => void
  onSignup: () => void
  onForgot: () => void
}

export function LoginPage({ onAuthed, onGuest, onSignup, onForgot }: LoginPageProps) {
  const { t } = useTranslation()
  const actions = useAuthActions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event: SyntheticEvent) => {
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
    <AuthForm
      className="gap-8"
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      onSubmit={handleSubmit}
      submitLabel={busy ? t('auth.login.submitting') : t('auth.login.submit')}
      busy={busy}
      onGuest={handleGuest}
      footer={
        <>
          {t('auth.login.noAccount')}{' '}
          <button type="button" onClick={onSignup} className="font-semibold text-heading">
            {t('auth.login.createAccount')}
          </button>
        </>
      }
    >
      <EmailField value={email} onValueChange={setEmail} error={errors.email} />
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
    </AuthForm>
  )
}
