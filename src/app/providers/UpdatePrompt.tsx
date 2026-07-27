import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useSplashDone } from '@/shared/lib'

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000

export function UpdatePrompt() {
  const { t } = useTranslation()
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  // Registering the worker is urgent; interrupting the launch overlay to announce an update is
  // not. The toast waits for the splash and then raises itself, rather than being dropped.
  const splashDone = useSplashDone()

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: (_url, reg) => setRegistration(reg ?? null),
  })

  useEffect(() => {
    if (!registration) return
    const check = () => {
      if (!document.hidden) void registration.update()
    }
    const id = window.setInterval(check, UPDATE_CHECK_INTERVAL)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [registration])

  useEffect(() => {
    if (!needRefresh || !splashDone) return
    const id = toast(t('update.available'), {
      description: t('update.description'),
      duration: Infinity,
      action: {
        label: t('update.reload'),
        onClick: () => void updateServiceWorker(true),
      },
    })
    return () => {
      toast.dismiss(id)
    }
  }, [needRefresh, splashDone, t, updateServiceWorker])

  return null
}
