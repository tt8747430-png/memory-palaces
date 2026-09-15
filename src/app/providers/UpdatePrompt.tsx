import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { registerSW } from 'virtual:pwa-register'
import { activateWaitingWorker, watchWaitingWorker, type WorkerLike } from '@/shared/lib'

const UPDATE_CHECK_INTERVAL = 15 * 60 * 1000
const RELOAD_FALLBACK = 3000
const TOAST_ID = 'app-update'

let registration: Promise<ServiceWorkerRegistration | undefined> | undefined

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
  const [waiting, setWaiting] = useState<WorkerLike | null>(null)

  useEffect(() => {
    let stop: (() => void) | undefined
    let cancelled = false

    void registerOnce().then((reg) => {
      if (!reg || cancelled) return
      const stopWatching = watchWaitingWorker(reg, setWaiting)

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
    navigator.serviceWorker.addEventListener('controllerchange', reloadOnce, { once: true })
    window.setTimeout(reloadOnce, RELOAD_FALLBACK)
    activateWaitingWorker(waiting)
  }, [waiting])

  useEffect(() => {
    if (!waiting) return
    const show = () => {
      if (document.hidden) return
      toast(t('update.available'), {
        id: TOAST_ID,
        description: t('update.description'),
        duration: Infinity,
        action: { label: t('update.reload'), onClick: reload },
      })
    }
    show()
    document.addEventListener('visibilitychange', show)
    return () => {
      document.removeEventListener('visibilitychange', show)
      toast.dismiss(TOAST_ID)
    }
  }, [waiting, t, reload])

  return null
}
