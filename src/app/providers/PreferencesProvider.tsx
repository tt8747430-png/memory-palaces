import { type ReactNode, useEffect } from 'react'
import { MotionConfig } from 'motion/react'
import { readReducedMotion, selectIsReady, setHapticsEnabled } from '@/shared/lib'
import { i18n } from '@/shared/i18n'
import {
  selectHaptics,
  selectLanguage,
  selectReducedMotion,
  selectTheme,
  usePreferencesStore,
} from '@/entities/preferences'
import { useDeviceMotion } from './use-device-motion'
import { useDeviceTheme } from './use-device-theme'

/**
 * Hands the learner's preferences to the device: the document's theme and motion, the status bar,
 * the mirrors the next launch's boot script reads, haptics and the language. Mounted only once the
 * preferences store has loaded — until then the selectors answer with defaults, and a default handed
 * over here is a colour iOS paints while the app loads, or a mirror overwritten for the next launch
 * (ADR 0007). Until it mounts, the boot script's paint stands.
 */
function DevicePreferences() {
  const theme = usePreferencesStore(selectTheme)
  const reducedMotion = usePreferencesStore(selectReducedMotion)
  const haptics = usePreferencesStore(selectHaptics)
  const language = usePreferencesStore(selectLanguage)

  useDeviceTheme(theme)
  useDeviceMotion(reducedMotion)

  useEffect(() => {
    setHapticsEnabled(haptics)
  }, [haptics])

  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language)
  }, [language])

  return null
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const ready = usePreferencesStore(selectIsReady)
  const asked = usePreferencesStore(selectReducedMotion)
  // Until the store has loaded, the boot script's answer: the OS's, or the learner's mirrored switch.
  const damped = ready ? asked : readReducedMotion()

  return (
    <MotionConfig reducedMotion={damped ? 'always' : 'user'}>
      {ready ? <DevicePreferences /> : null}
      {children}
    </MotionConfig>
  )
}
