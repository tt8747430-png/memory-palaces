import { type FormEvent, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Mail, MailCheck } from 'lucide-react'
import { authEntrance, isEmail, useAuthGateway } from '@/shared/lib'
import { AuthScreen, AuthField, Button } from '@/shared/ui'
import { AuthLogo } from '@/widgets/palace-threshold'
import { requestPasswordReset } from '@/features/session'

export interface ForgotPasswordPageProps {
  onBack: () => void
}

const RESEND_SECONDS = 30

/** Keep the first two characters, mask the rest of the local part. */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain || !local) return email
  const head = local.slice(0, Math.min(2, local.length))
  return `${head}${'•'.repeat(Math.max(3, local.length - head.length))}@${domain}`
}

/** Password recovery. No backend: sending is simulated, then a "check your inbox"
 * confirmation with a rate-limited resend. Shares the auth visual language. */
export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const { t } = useTranslation()
  const gateway = useAuthGateway()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const send = async () => {
    setBusy(true)
    await requestPasswordReset(gateway, email.trim())
    setBusy(false)
    setSent(true)
    setCooldown(RESEND_SECONDS)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!isEmail(email)) {
      setError(t('auth.errors.emailInvalid'))
      return
    }
    setError(undefined)
    void send()
  }

  return (
    <AuthScreen>
      <div className="pt-2">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1.5 inline-flex min-h-11 items-center gap-1.5 rounded-control px-1.5 text-[length:var(--p-text-label)] font-medium text-heading transition-colors active:bg-primary/[0.04]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('auth.forgot.backToLogin')}
        </button>
      </div>

      <motion.div
        key={sent ? 'sent' : 'email'}
        {...authEntrance}
        className="flex flex-1 flex-col justify-center gap-8 py-10"
      >
        <header className="flex flex-col items-center gap-4 text-center">
          {sent ? (
            <span
              aria-hidden
              className="grid size-16 place-items-center rounded-full bg-info-surface text-primary shadow-rest"
            >
              <MailCheck className="size-8" />
            </span>
          ) : (
            <AuthLogo className="size-16" />
          )}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-balance text-[length:var(--p-text-headline)] font-bold tracking-tight text-heading">
              {sent ? t('auth.forgot.sentTitle') : t('auth.forgot.title')}
            </h1>
            <p className="text-pretty text-muted-foreground">
              {sent ? t('auth.forgot.sentBody', { email: maskEmail(email.trim()) }) : t('auth.forgot.subtitle')}
            </p>
          </div>
        </header>

        {sent ? (
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={cooldown > 0}
            onClick={() => void send()}
          >
            {cooldown > 0 ? t('auth.forgot.resendIn', { seconds: cooldown }) : t('auth.forgot.resend')}
          </Button>
        ) : (
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
              error={error}
            />
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
            </Button>
          </form>
        )}
      </motion.div>
    </AuthScreen>
  )
}
