import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { CloudOff } from 'lucide-react'
import { i18n } from '@/shared/i18n'
import { useSplashStore } from '@/shared/lib'
import { Button, Curtain, Empty } from '@/shared/ui'
import { SplashOverlay } from '@/widgets/splash'
import { App } from './App'
import { createServices, type Services } from './composition-root'

/**
 * StrictMode mounts every effect twice in development, and two `createServices()` calls would open
 * the same RxDB database twice. Memoised here rather than at module scope, so the dynamic imports
 * inside `createServices` still stay out of the entry graph.
 */
let pending: Promise<Services> | null = null
const bootServices = (): Promise<Services> => (pending ??= createServices())

/**
 * The one failure the app cannot recover from. Opening the database is the first thing that
 * happens and everything else depends on it, so there is no degraded mode to fall back to — an
 * empty shell would be a lie. Say so, and offer the only action that can help.
 */
function BootFailure() {
  const { t } = useTranslation()
  return (
    <Curtain role="alert">
      <Empty
        variant="hero"
        icon={<CloudOff className="size-7" aria-hidden />}
        title={t('boot.failedTitle')}
        description={t('boot.failedBody')}
        action={<Button onClick={() => window.location.reload()}>{t('boot.reload')}</Button>}
      />
    </Curtain>
  )
}

/**
 * Above the services boundary: paints the splash on the first frame, builds the object graph
 * behind it, and only then mounts the app.
 *
 * The splash lifts when *both* halves are done — its own animation, so a fast device does not
 * flash it, and `createServices()`, so a slow one does not show an empty shell behind it.
 */
export function Bootstrap() {
  const [services, setServices] = useState<Services | null>(null)
  const [failed, setFailed] = useState(false)
  const [animationDone, setAnimationDone] = useState(false)
  const splashDone = useSplashStore((state) => state.done)
  const finishSplash = useSplashStore((state) => state.finish)

  useEffect(() => {
    let live = true
    void bootServices().then(
      (built) => {
        if (live) setServices(built)
      },
      (error: unknown) => {
        console.error('Mindscape could not start', error)
        if (live) setFailed(true)
      },
    )
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    if (animationDone && services) finishSplash()
  }, [animationDone, services, finishSplash])

  return (
    <I18nextProvider i18n={i18n}>
      {failed ? <BootFailure /> : services ? <App services={services} /> : null}
      <AnimatePresence>
        {failed || splashDone ? null : <SplashOverlay onDone={() => setAnimationDone(true)} />}
      </AnimatePresence>
    </I18nextProvider>
  )
}
