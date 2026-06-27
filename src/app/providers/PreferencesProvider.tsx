import { type ReactNode, useEffect } from 'react'
import { MotionConfig } from 'motion/react'
import { setHapticsEnabled } from '@/shared/lib'
import { i18n } from '@/shared/i18n'
import { selectEffectivePreferences, usePreferencesStore, usePreferencesStoreApi, } from '@/entities/preferences'
import { ThemeProvider } from './ThemeProvider'

/** Applies user preferences to the running app: sets the appearance theme, drives
 * MotionConfig's reduced-motion from the pref (falling back to the OS setting when off),
 * syncs the global haptics flag, and applies the saved language to i18next. Starts the
 * preferences store so the values stay live. Effective preferences default to `system`
 * before the record loads, so the OS theme applies immediately. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const store = usePreferencesStoreApi()
  const preferences = usePreferencesStore(selectEffectivePreferences)

  useEffect(() => {
    store.getState().start()
  }, [store])

  useEffect(() => {
    setHapticsEnabled(preferences.haptics)
  }, [preferences.haptics])

  useEffect(() => {
    if (i18n.language !== preferences.language) void i18n.changeLanguage(preferences.language)
  }, [preferences.language])

  return (
    <ThemeProvider theme={preferences.theme}>
      <MotionConfig reducedMotion={preferences.reducedMotion ? 'always' : 'user'}>
        {children}
      </MotionConfig>
    </ThemeProvider>
  )
}
