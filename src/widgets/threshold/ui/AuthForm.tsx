import { type ReactNode, type SyntheticEvent, useState } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { authErrorMessage, authRise, authStagger, cn, useOnline } from '@/shared/lib'
import type { OAuthProvider } from '@/shared/api'
import { AuthScreen, Button, OfflineNotice, SocialButtons } from '@/shared/ui'
import { useAuthActions } from '@/features/session'
import { AuthHeader } from './AuthHeader'

export interface AuthFormProps {
  title: string
  subtitle: string
  children: ReactNode
  onSubmit: (event: SyntheticEvent) => void
  submitLabel: string
  busy?: boolean
  onGuest: () => void
  footer: ReactNode
  className?: string
}

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
  const [pending, setPending] = useState<OAuthProvider | null>(null)

  const enterAsGuest = async () => {
    await continueAsGuest()
    onGuest()
  }

  const startProvider = async (provider: OAuthProvider) => {
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
        <motion.div variants={authRise}>
          <AuthHeader title={title} subtitle={subtitle} />
        </motion.div>

        {online ? null : (
          <motion.div variants={authRise} className="pb-4">
            <OfflineNotice />
          </motion.div>
        )}

        <motion.form
          variants={authRise}
          className="flex flex-col gap-4"
          onSubmit={onSubmit}
          noValidate
        >
          {children}
          <Button type="submit" size="lg" className="w-full" disabled={busy || !online}>
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

        <motion.p variants={authRise} className="text-center text-label text-muted-foreground">
          {footer}
        </motion.p>
      </motion.div>
    </AuthScreen>
  )
}
