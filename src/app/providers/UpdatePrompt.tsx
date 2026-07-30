import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { registerSW } from 'virtual:pwa-register'
import {
  activateWaitingWorker,
  useSplashDone,
  watchWaitingWorker,
  type WorkerLike,
} from '@/shared/lib'

const UPDATE_CHECK_INTERVAL = 15 * 60 * 1000
const RELOAD_FALLBACK = 3000
const TOAST_ID = 'app-update'

let registration: Promise<ServiceWorkerRegistration | undefined> | undefined

/**
 * Registers the service worker once per document. `registerSW` builds a Workbox
 * instance that refuses to register twice, and StrictMode runs effects twice.
 */
function registerOnce() {
  registration ??= new Promise((resolve) => {
    registerSW({
      immediate: true,
      onRegisteredSW: (_url, reg) => resolve(reg),
      onRegisterError: () => resolve(undefined),
    })
  })
  return registration
}

export function UpdatePrompt() {
  const { t } = useTranslation()
  const splashDone = useSplashDone()
  const [waiting, setWaiting] = useState<WorkerLike | null>(null)

  useEffect(() => {
    let stop: (() => void) | undefined
    let cancelled = false

    void registerOnce().then((reg) => {
      if (!reg || cancelled) return
      const stopWatching = watchWaitingWorker(reg, setWaiting)

      // An update published while the app is open is only noticed if we ask for
      // it, so ask on launch, on every return to the app, on reconnect, and
      // periodically for a window that is left open all day.
      const check = () => {
        if (!document.hidden) void reg.update().catch(() => {})
      }
      const interval = window.setInterval(check, UPDATE_CHECK_INTERVAL)
      document.addEventListener('visibilitychange', check)
      window.addEventListener('online', check)
      check()

      stop = () => {
        stopWatching()
        window.clearInterval(interval)
        document.removeEventListener('visibilitychange', check)
        window.removeEventListener('online', check)
      }
    })

    return () => {
      cancelled = true
      stop?.()
    }
  }, [])

  const reload = useCallback(() => {
    if (!waiting) return
    let reloaded = false
    const reloadOnce = () => {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    }
    // The new worker claims its clients, so it takes over without a navigation.
    navigator.serviceWorker.addEventListener('controllerchange', reloadOnce, { once: true })
    // Reload regardless if the handover goes unreported, so the prompt is never
    // left looking like it did nothing.
    window.setTimeout(reloadOnce, RELOAD_FALLBACK)
    activateWaitingWorker(waiting)
  }, [waiting])

  useEffect(() => {
    if (!waiting || !splashDone) return
    const show = () => {
      if (document.hidden) return
      // A fixed id keeps this to a single toast: re-showing updates the one on
      // screen, and recreates it if the user swiped it away.
      toast(t('update.available'), {
        id: TOAST_ID,
        description: t('update.description'),
        duration: Infinity,
        action: { label: t('update.reload'), onClick: reload },
      })
    }
    show()
    // The update is still pending after a dismissal, so offer it again whenever
    // the user comes back to the app.
    document.addEventListener('visibilitychange', show)
    return () => {
      document.removeEventListener('visibilitychange', show)
      toast.dismiss(TOAST_ID)
    }
  }, [waiting, splashDone, t, reload])

  return null
}
