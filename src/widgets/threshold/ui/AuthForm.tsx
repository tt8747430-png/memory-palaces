import type { ReactNode, SyntheticEvent } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { authRise, authStagger, cn } from '@/shared/lib'
import { AuthScreen, Button, SocialButtons } from '@/shared/ui'
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
  const { continueAsGuest } = useAuthActions()

  const enterAsGuest = async () => {
    await continueAsGuest()
    onGuest()
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
          <SocialButtons />
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
