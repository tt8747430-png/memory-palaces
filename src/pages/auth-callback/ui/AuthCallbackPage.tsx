import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/shared/api/supabase'
import { AuthScreen, Button } from '@/shared/ui'
import { AuthHeader } from '@/widgets/threshold'

export interface AuthCallbackPageProps {
  /** True once a session has arrived through `onAuthChange` — the only success signal. */
  sessionReady: boolean
  onDone: () => void
  onCancel: () => void
  /** Injected for tests; the real one exchanges the PKCE `?code=` for a session. */
  exchangeCode?: (code: string) => Promise<{ error: { message: string } | null }>
}

const exchangeWithSupabase = (code: string) => supabase.auth.exchangeCodeForSession(code)

/**
 * Where Google/Apple drop the browser back. `detectSessionInUrl` normally exchanges the code
 * before this renders, so the happy path is a beat of "signing you in" and a redirect home; the
 * explicit exchange is the fallback when that has not happened.
 */
export function AuthCallbackPage({
  sessionReady,
  onDone,
  onCancel,
  exchangeCode = exchangeWithSupabase,
}: AuthCallbackPageProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionReady) {
      onDone()
      return
    }
    const params = new URLSearchParams(window.location.search)
    const denied = params.get('error_description') ?? params.get('error')
    if (denied) {
      setError(denied)
      return
    }
    const code = params.get('code')
    if (!code) return

    let cancelled = false
    void exchangeCode(code).then(({ error: failure }) => {
      if (!cancelled && failure) setError(failure.message)
    })
    return () => {
      cancelled = true
    }
  }, [sessionReady, onDone, exchangeCode])

  return (
    <AuthScreen>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10 text-center">
        {error ? (
          <>
            <AuthHeader title={t('auth.callback.failedTitle')} subtitle={error} />
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
