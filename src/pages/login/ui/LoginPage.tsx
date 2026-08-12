import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { authErrorMessage, emailErrorKey, passwordErrorKey, useValidatedSubmit } from '@/shared/lib'
import { EmailField, PasswordField } from '@/shared/ui'
import { AuthForm, AuthSwitchLink } from '@/widgets/threshold'
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
  const { errors, busy, onSubmit } = useValidatedSubmit<'email' | 'password'>(
    () => {
      const emailKey = emailErrorKey(email)
      const passwordKey = passwordErrorKey(password)
      return {
        email: emailKey ? t(emailKey) : undefined,
        password: passwordKey ? t(passwordKey) : undefined,
      }
    },
    async () => {
      try {
        await actions.signIn({ email: email.trim(), password })
      } catch (error) {
        toast.error(authErrorMessage(error, t, t('auth.errors.signInFailed')))
        return
      }
      onAuthed()
    },
  )

  return (
    <AuthForm
      className="gap-8"
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      onSubmit={onSubmit}
      submitLabel={busy ? t('auth.login.submitting') : t('auth.login.submit')}
      busy={busy}
      onGuest={onGuest}
      footer={
        <AuthSwitchLink
          prompt={t('auth.login.noAccount')}
          label={t('auth.login.createAccount')}
          onClick={onSignup}
        />
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
          className="text-(length:--p-text-label) font-medium text-heading"
        >
          {t('auth.login.forgot')}
        </button>
      </div>
    </AuthForm>
  )
}
