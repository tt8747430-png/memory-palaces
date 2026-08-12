import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { MailCheck, User } from 'lucide-react'
import { authErrorMessage, emailErrorKey, passwordErrorKey, useValidatedSubmit } from '@/shared/lib'
import { LEGAL_URLS } from '@/shared/config/constants'
import { AuthField, AuthScreen, Button, EmailField, PasswordField } from '@/shared/ui'
import { AuthForm, AuthHeader, AuthSwitchLink } from '@/widgets/threshold'
import { useAuthActions } from '@/features/session'

export interface SignupPageProps {
  onSuccess: () => void
  onGuest: () => void
  onLogin: () => void
}

export function SignupPage({ onSuccess, onGuest, onLogin }: SignupPageProps) {
  const { t } = useTranslation()
  const actions = useAuthActions()
  const termsId = useId()
  const termsErrorId = useId()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const { errors, busy, onSubmit } = useValidatedSubmit<'name' | 'email' | 'password' | 'terms'>(
    () => {
      const emailKey = emailErrorKey(email)
      const passwordKey = passwordErrorKey(password, { strong: true })
      return {
        name: name.trim() ? undefined : t('auth.errors.nameRequired'),
        email: emailKey ? t(emailKey) : undefined,
        password: passwordKey ? t(passwordKey) : undefined,
        terms: agreed ? undefined : t('auth.errors.termsRequired'),
      }
    },
    async () => {
      try {
        const { sessionActive } = await actions.signUp({
          name: name.trim(),
          email: email.trim(),
          password,
        })
        // Email confirmation is on: the account exists but there is no session to use yet, so
        // saying "welcome" and showing the app would be a lie — and would sync nothing.
        if (!sessionActive) {
          setAwaitingConfirmation(true)
          return
        }
      } catch (error) {
        toast.error(authErrorMessage(error, t, t('auth.errors.signUpFailed')))
        return
      }
      onSuccess()
    },
  )

  if (awaitingConfirmation) {
    return (
      <AuthScreen>
        <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10 text-center">
          <span
            aria-hidden
            className="grid size-16 place-items-center rounded-full bg-info-surface text-primary shadow-rest"
          >
            <MailCheck className="size-8" />
          </span>
          <AuthHeader
            title={t('auth.confirm.title')}
            subtitle={t('auth.confirm.body', { email: email.trim() })}
          />
          <Button variant="secondary" size="lg" className="w-full" onClick={onLogin}>
            {t('auth.confirm.backToLogin')}
          </Button>
        </div>
      </AuthScreen>
    )
  }

  return (
    <AuthForm
      className="gap-7"
      title={t('auth.signup.title')}
      subtitle={t('auth.signup.subtitle')}
      onSubmit={onSubmit}
      submitLabel={busy ? t('auth.signup.submitting') : t('auth.signup.submit')}
      busy={busy}
      onGuest={onGuest}
      footer={
        <AuthSwitchLink
          prompt={t('auth.signup.haveAccount')}
          label={t('auth.signup.signIn')}
          onClick={onLogin}
        />
      }
    >
      <AuthField
        id="name"
        label={t('auth.signup.nameLabel')}
        autoComplete="name"
        placeholder={t('auth.signup.namePlaceholder')}
        icon={<User />}
        value={name}
        onValueChange={setName}
        error={errors.name}
      />
      <EmailField value={email} onValueChange={setEmail} error={errors.email} />
      <PasswordField
        id="password"
        label={t('auth.passwordLabel')}
        autoComplete="new-password"
        placeholder={t('auth.passwordPlaceholder')}
        value={password}
        onValueChange={setPassword}
        error={errors.password}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={termsId}
          className="flex items-start gap-2.5 text-(length:--p-text-label) text-muted-foreground"
        >
          <input
            id={termsId}
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            aria-describedby={errors.terms ? termsErrorId : undefined}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span>
            {t('auth.signup.agreePrefix')}{' '}
            <LegalLink href={LEGAL_URLS.terms} label={t('auth.signup.terms')} />{' '}
            {t('auth.signup.and')}{' '}
            <LegalLink href={LEGAL_URLS.privacy} label={t('auth.signup.privacy')} />
          </span>
        </label>
        {errors.terms ? (
          <p
            id={termsErrorId}
            role="alert"
            className="text-(length:--p-text-label) text-(--danger-on-surface)"
          >
            {errors.terms}
          </p>
        ) : null}
      </div>
    </AuthForm>
  )
}

function LegalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="font-semibold text-accent underline underline-offset-2"
    >
      {label}
    </a>
  )
}
