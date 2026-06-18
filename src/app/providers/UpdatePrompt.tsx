import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** How often to ask the browser for a newer service worker while the app stays open.
 * Installed PWAs rarely reload, so without an active check a shipped update can sit
 * unseen until the user force-quits several times. */
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000 // 1h

/**
 * Surfaces an in-app prompt when a new service worker is waiting. Registered with
 * `registerType: 'prompt'`, so the update never applies on its own — the user taps
 * "Reload", which skip-waits the new worker and reloads. Polls for updates on an
 * interval and whenever the app regains focus, so the prompt appears promptly instead
 * of after several cold starts. Renders nothing; the prompt is a toast.
 *
 * The same pattern will later carry a "your palaces changed elsewhere — sync now"
 * prompt once cloud sync lands.
 */
export function UpdatePrompt() {
  const { t } = useTranslation()
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: (_url, reg) => setRegistration(reg ?? null),
  })

  // Poll for a waiting worker while open and on focus regain.
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
    if (!needRefresh) return
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
  }, [needRefresh, t, updateServiceWorker])

  return null
}
