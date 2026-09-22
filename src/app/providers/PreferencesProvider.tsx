import { type ReactNode, useEffect, useLayoutEffect } from 'react'
import { MotionConfig } from 'motion/react'
import { setHapticsEnabled } from '@/shared/lib'
import { i18n } from '@/shared/i18n'
import { selectEffectivePreferences, usePreferencesStore } from '@/entities/preferences'
import { MOTION_MIRROR_KEY } from './boot-paint'
import { ThemeProvider } from './ThemeProvider'

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const preferences = usePreferencesStore(selectEffectivePreferences)
  const asked = preferences.reducedMotion

  useEffect(() => {
    setHapticsEnabled(preferences.haptics)
  }, [preferences.haptics])

  useEffect(() => {
    if (i18n.language !== preferences.language) void i18n.changeLanguage(preferences.language)
  }, [preferences.language])

  /**
   * `MotionConfig` below reaches `motion`'s animations and nothing else. Every CSS transition in the
   * app — and `useStackLanding`, which animates by hand — reads this attribute instead, so the
   * switch the learner threw damps the same things the OS setting does.
   */
  useLayoutEffect(() => {
    const media = window.matchMedia(REDUCE_QUERY)
    const apply = () => {
      document.documentElement.dataset.reducedMotion = asked || media.matches ? 'reduce' : 'system'
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [asked])

  useEffect(() => {
    try {
      localStorage.setItem(MOTION_MIRROR_KEY, asked ? 'on' : 'off')
    } catch {}
  }, [asked])

  return (
    <ThemeProvider theme={preferences.theme}>
      <MotionConfig reducedMotion={asked ? 'always' : 'user'}>{children}</MotionConfig>
    </ThemeProvider>
  )
}
