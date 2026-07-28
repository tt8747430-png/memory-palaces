import { type SyntheticEvent, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, User } from 'lucide-react'
import { isEmail, isLongEnoughPassword } from '@/shared/lib'
import { LEGAL_URLS } from '@/shared/config/constants'
import { AuthField, PasswordField } from '@/shared/ui'
import { AuthForm } from '@/widgets/threshold'
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
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    terms?: string
  }>({})
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event: SyntheticEvent) => {
    event.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = t('auth.errors.nameRequired')
    if (!email.trim()) next.email = t('auth.errors.emailRequired')
    else if (!isEmail(email)) next.email = t('auth.errors.emailInvalid')
    if (!password) next.password = t('auth.errors.passwordRequired')
    else if (!isLongEnoughPassword(password)) next.password = t('auth.errors.passwordShort')
    if (!agreed) next.terms = t('auth.errors.termsRequired')
    setErrors(next)
    if (next.name || next.email || next.password || next.terms) return

    setBusy(true)
    await actions.signUp({ name: name.trim(), email: email.trim() })
    onSuccess()
  }

  const handleGuest = async () => {
    await actions.continueAsGuest()
    onGuest()
  }

  return (
    <AuthForm
      className="gap-7"
      title={t('auth.signup.title')}
      subtitle={t('auth.signup.subtitle')}
      onSubmit={handleSubmit}
      submitLabel={busy ? t('auth.signup.submitting') : t('auth.signup.submit')}
      busy={busy}
      onGuest={handleGuest}
      footer={
        <>
          {t('auth.signup.haveAccount')}{' '}
          <button type="button" onClick={onLogin} className="font-semibold text-heading">
            {t('auth.signup.signIn')}
          </button>
        </>
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
        autoComplete="new-password"
        placeholder={t('auth.passwordPlaceholder')}
        value={password}
        onValueChange={setPassword}
        error={errors.password}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={termsId}
          className="flex items-start gap-2.5 text-[length:var(--p-text-label)] text-muted-foreground"
        >
          <input
            id={termsId}
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            aria-describedby={errors.terms ? termsErrorId : undefined}
            className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
          />
          <span>
            {t('auth.signup.agreePrefix')}{' '}
            <a
              href={LEGAL_URLS.terms}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="font-semibold text-accent underline underline-offset-2"
            >
              {t('auth.signup.terms')}
            </a>{' '}
            {t('auth.signup.and')}{' '}
            <a
              href={LEGAL_URLS.privacy}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="font-semibold text-accent underline underline-offset-2"
            >
              {t('auth.signup.privacy')}
            </a>
          </span>
        </label>
        {errors.terms ? (
          <p
            id={termsErrorId}
            role="alert"
            className="text-[length:var(--p-text-label)] text-[var(--danger-on-surface)]"
          >
            {errors.terms}
          </p>
        ) : null}
      </div>
    </AuthForm>
  )
}
