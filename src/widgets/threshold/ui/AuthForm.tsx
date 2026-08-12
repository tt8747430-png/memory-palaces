import { type ReactNode, type SyntheticEvent, useState } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { authErrorMessage, authRise, authStagger, cn, useOnline } from '@/shared/lib'
import { AuthScreen, Button, SocialButtons, type SocialProvider } from '@/shared/ui'
import { useAuthActions } from '@/features/session'
import { AuthHeader } from './AuthHeader'

export interface AuthFormProps {
  title: string
  subtitle: string
  /** The fields, plus anything that belongs inside the form element. */
  children: ReactNode
  onSubmit: (event: SyntheticEvent) => void
  submitLabel: string
  busy?: boolean
  /** Where to go once the guest session exists — the form opens it itself. */
  onGuest: () => void
  /** The line offering the other way in — sign up from login, and back. */
  footer: ReactNode
  className?: string
}

/**
 * The shape both ways in share: logo and title, form, guest escape hatch, social buttons, a line
 * pointing at the other screen. Each band rises in turn.
 */
export function AuthForm({
  title,
  subtitle,
  children,
  onSubmit,
  submitLabel,
  busy = false,
  onGuest,
  footer,
  className,
}: AuthFormProps) {
  const { t } = useTranslation()
  const { continueAsGuest, signInWithProvider } = useAuthActions()
  const online = useOnline()
  const [pending, setPending] = useState<SocialProvider | null>(null)

  const enterAsGuest = async () => {
    await continueAsGuest()
    onGuest()
  }

  // The redirect leaves the app, so `pending` only ever clears on failure — a successful press
  // never comes back to this component.
  const startProvider = async (provider: SocialProvider) => {
    setPending(provider)
    try {
      await signInWithProvider(provider)
    } catch (error) {
      setPending(null)
      toast.error(authErrorMessage(error, t, t('auth.errors.socialFailed')))
    }
  }

  return (
    <AuthScreen>
      <motion.div
        variants={authStagger}
        initial="initial"
        animate="animate"
        className={cn('flex flex-1 flex-col justify-center py-10', className)}
      >
        <motion.header variants={authRise} className="flex flex-col items-center gap-4 text-center">
          <AuthHeader title={title} subtitle={subtitle} />
        </motion.header>

        <motion.form
          variants={authRise}
          className="flex flex-col gap-4"
          onSubmit={onSubmit}
          noValidate
        >
          {children}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {submitLabel}
          </Button>
        </motion.form>

        <motion.div variants={authRise}>
          <Button variant="ghost" size="lg" className="w-full" onClick={() => void enterAsGuest()}>
            {t('auth.continueAsGuest')}
          </Button>
        </motion.div>

        <motion.div variants={authRise}>
          <SocialButtons
            onSelect={(provider) => void startProvider(provider)}
            pending={pending}
            unavailableReason={online ? undefined : t('auth.errors.offline')}
          />
        </motion.div>

        <motion.p
          variants={authRise}
          className="text-center text-(length:--p-text-label) text-muted-foreground"
        >
          {footer}
        </motion.p>
      </motion.div>
    </AuthScreen>
  )
}
