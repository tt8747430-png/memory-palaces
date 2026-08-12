import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { parseAuthCallback, useAuthGateway } from '@/shared/lib'
import { AuthScreen, Button } from '@/shared/ui'
import { AuthHeader } from '@/widgets/threshold'

export interface AuthCallbackPageProps {
  /** True once a session has arrived through `onAuthChange` — the only success signal. */
  sessionReady: boolean
  /** Where to continue: recovery links must reach a screen that can set a password. */
  onDone: (next: 'recovery' | 'home') => void
  onCancel: () => void
}

/**
 * Where Google, Apple and recovery links drop the browser back. `detectSessionInUrl` normally
 * exchanges the code before this renders, so the happy path is a beat of "signing you in" and a
 * redirect; the explicit exchange is the fallback when that has not happened.
 */
export function AuthCallbackPage({ sessionReady, onDone, onCancel }: AuthCallbackPageProps) {
  const { t } = useTranslation()
  const gateway = useAuthGateway()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const { code, refused, next } = parseAuthCallback(window.location.search)
    if (sessionReady) {
      onDone(next)
      return
    }
    if (refused) {
      setFailed(true)
      return
    }
    if (!code) return

    let cancelled = false
    void gateway.completeAuthRedirect(code).catch(() => {
      if (!cancelled) setFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [sessionReady, onDone, gateway])

  return (
    <AuthScreen>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10 text-center">
        {failed ? (
          <>
            {/* Never the provider's own words here: they are untranslated, and an expired link
                reads the same to a person however it is phrased. */}
            <AuthHeader
              title={t('auth.callback.failedTitle')}
              subtitle={t('auth.errors.callbackFailed')}
            />
            <Button size="lg" className="w-full" onClick={onCancel}>
              {t('auth.callback.backToLogin')}
            </Button>
          </>
        ) : (
          <>
            <Loader2
              className="size-8 animate-spin text-primary motion-reduce:animate-none"
              aria-hidden
            />
            <p role="status" className="text-(length:--p-text-body) text-muted-foreground">
              {t('auth.callback.signingIn')}
            </p>
          </>
        )}
      </div>
    </AuthScreen>
  )
}
