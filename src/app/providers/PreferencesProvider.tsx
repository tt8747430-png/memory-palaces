import { type ReactNode, useEffect } from 'react'
import { MotionConfig } from 'motion/react'
import { setHapticsEnabled } from '@/shared/lib'
import { i18n } from '@/shared/i18n'
import {
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { ThemeProvider } from './ThemeProvider'

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
