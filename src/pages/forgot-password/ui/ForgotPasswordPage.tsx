import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, MailCheck } from 'lucide-react'
import {
  authEntrance,
  authErrorMessage,
  emailErrorKey,
  useAuthGateway,
  useValidatedSubmit,
} from '@/shared/lib'
import { AuthScreen, Button, EmailField } from '@/shared/ui'
import { AuthHeader } from '@/widgets/threshold'
import { requestPasswordReset } from '@/features/session'

export interface ForgotPasswordPageProps {
  onBack: () => void
}

const RESEND_SECONDS = 30

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain || !local) return email
  const head = local.slice(0, Math.min(2, local.length))
  return `${head}${'•'.repeat(Math.max(3, local.length - head.length))}@${domain}`
}

export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const { t } = useTranslation()
  const gateway = useAuthGateway()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const send = async () => {
    try {
      await requestPasswordReset(gateway, email.trim())
    } catch (error) {
      toast.error(authErrorMessage(error, t, t('auth.errors.resetFailed')))
      return
    }
    setSent(true)
    setCooldown(RESEND_SECONDS)
  }

  const { errors, busy, onSubmit } = useValidatedSubmit<'email'>(() => {
    const key = emailErrorKey(email)
    return { email: key ? t(key) : undefined }
  }, send)

  return (
    <AuthScreen>
      <div className="pt-2">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1.5 inline-flex min-h-11 items-center gap-1.5 rounded-control px-1.5 text-(length:--p-text-label) font-medium text-heading transition-colors active:bg-primary/4"
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
          <AuthHeader
            title={sent ? t('auth.forgot.sentTitle') : t('auth.forgot.title')}
            subtitle={
              sent
                ? t('auth.forgot.sentBody', { email: maskEmail(email.trim()) })
                : t('auth.forgot.subtitle')
            }
            mark={
              sent ? (
                <span
                  aria-hidden
                  className="grid size-16 place-items-center rounded-full bg-info-surface text-primary shadow-rest"
                >
                  <MailCheck className="size-8" />
                </span>
              ) : undefined
            }
          />
        </header>

        {sent ? (
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={cooldown > 0}
            onClick={() => void send()}
          >
            {cooldown > 0
              ? t('auth.forgot.resendIn', { seconds: cooldown })
              : t('auth.forgot.resend')}
          </Button>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <EmailField value={email} onValueChange={setEmail} error={errors.email} />
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
            </Button>
          </form>
        )}
      </motion.div>
    </AuthScreen>
  )
}
