import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { CloudOff } from 'lucide-react'
import { i18n } from '@/shared/i18n'
import { selectSplashShown, selectSplashWaitingOnSync, useSplashStore } from '@/shared/lib'
import { Button, Curtain, Empty } from '@/shared/ui'
import { SplashOverlay } from '@/widgets/splash'
import { App } from './App'
import { createServices, type Services } from './composition-root'

let pending: Promise<Services> | null = null
const bootServices = (): Promise<Services> => (pending ??= createServices())

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

export function Bootstrap() {
  const [services, setServices] = useState<Services | null>(null)
  const [failed, setFailed] = useState(false)
  const shown = useSplashStore(selectSplashShown)
  const waiting = useSplashStore(selectSplashWaitingOnSync)
  const release = useSplashStore((state) => state.release)
  const skip = useSplashStore((state) => state.skip)

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
    if (services) release('boot')
  }, [services, release])

  return (
    <I18nextProvider i18n={i18n}>
      {failed ? <BootFailure /> : services ? <App services={services} /> : null}
      <AnimatePresence>
        {failed || !shown ? null : (
          <SplashOverlay waiting={waiting} onIntroDone={() => release('intro')} onSkip={skip} />
        )}
      </AnimatePresence>
    </I18nextProvider>
  )
}
