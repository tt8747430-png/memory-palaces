import { type SyntheticEvent, useState } from 'react'
import { motion, type Variants } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Mail } from 'lucide-react'
import { isEmail } from '@/shared/lib'
import { AuthField, AuthScreen, Button, PasswordField, SocialButtons } from '@/shared/ui'
import { AuthLogo } from '@/widgets/threshold'
import { useAuthActions } from '@/features/session'

export interface LoginPageProps {
  onAuthed: () => void
  onGuest: () => void
  onSignup: () => void
  onForgot: () => void
}

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

/** Sign-in screen. Mock auth (no credential check); also offers a guest door and a
 * route to sign-up / password recovery. Identity persists through the gateway. */
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
    <AuthScreen>
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="flex flex-1 flex-col justify-center gap-8 py-10"
      >
        <motion.header variants={rise} className="flex flex-col items-center gap-4 text-center">
          <AuthLogo className="size-16" />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-balance text-[length:var(--p-text-headline)] font-bold tracking-tight text-heading">
              {t('auth.login.title')}
            </h1>
            <p className="text-pretty text-muted-foreground">{t('auth.login.subtitle')}</p>
          </div>
        </motion.header>

        <motion.form
          variants={rise}
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
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
          {t('auth.login.noAccount')}{' '}
          <button type="button" onClick={onSignup} className="font-semibold text-heading">
            {t('auth.login.createAccount')}
          </button>
        </motion.p>
      </motion.div>
    </AuthScreen>
  )
}
