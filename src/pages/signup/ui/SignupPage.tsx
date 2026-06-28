import { type SyntheticEvent, useId, useState } from 'react'
import { motion, type Variants } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Mail, User } from 'lucide-react'
import { isEmail } from '@/shared/lib'
import { AuthField, AuthScreen, Button, PasswordField, SocialButtons } from '@/shared/ui'
import { AuthLogo } from '@/widgets/palace-threshold'
import { useAuthActions } from '@/features/session'

export interface SignupPageProps {
  onSuccess: () => void
  onGuest: () => void
  onLogin: () => void
}

const MIN_PASSWORD = 8

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/** Entry flow choreography: groups settle in sequence, each a short rise + fade.
 * Reduced motion is handled globally by MotionConfig, so no per-use fallback. */
const stagger: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}
const rise: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
}

/** Account creation. Mock auth (no verification): persists the identity, seeds the
 * profile (name/email), then hands off to the welcome moment. */
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
    else if (password.length < MIN_PASSWORD) next.password = t('auth.errors.passwordShort')
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
    <AuthScreen>
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="flex flex-1 flex-col justify-center gap-7 py-10"
      >
        <motion.header variants={rise} className="flex flex-col items-center gap-4 text-center">
          <AuthLogo className="size-16" />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-balance text-[length:var(--p-text-headline)] font-bold tracking-tight text-heading">
              {t('auth.signup.title')}
            </h1>
            <p className="text-pretty text-muted-foreground">{t('auth.signup.subtitle')}</p>
          </div>
        </motion.header>

        <motion.form
          variants={rise}
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
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
                <span className="font-semibold text-heading">{t('auth.signup.terms')}</span>{' '}
                {t('auth.signup.and')}{' '}
                <span className="font-semibold text-heading">{t('auth.signup.privacy')}</span>
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

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? t('auth.signup.submitting') : t('auth.signup.submit')}
          </Button>
        </motion.form>

        <motion.div variants={rise}>
          <Button variant="ghost" size="lg" className="w-full" onClick={handleGuest}>
            {t('auth.continueAsGuest')}
          </Button>
        </motion.div>

        <motion.div variants={rise}>
          <SocialButtons />
        </motion.div>

        <motion.p
          variants={rise}
          className="text-center text-[length:var(--p-text-label)] text-muted-foreground"
        >
          {t('auth.signup.haveAccount')}{' '}
          <button type="button" onClick={onLogin} className="font-semibold text-heading">
            {t('auth.signup.signIn')}
          </button>
        </motion.p>
      </motion.div>
    </AuthScreen>
  )
}
