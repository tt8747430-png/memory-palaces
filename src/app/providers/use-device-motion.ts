import { useEffect, useLayoutEffect } from 'react'
import { MOTION_MIRROR_KEY } from './boot-paint'

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Keeps `data-reduced-motion` on the learner's switch or the OS's, whichever asks, and mirrors the
 * switch for the next launch's boot script. `MotionConfig` reaches `motion`'s animations and nothing
 * else; every CSS transition in the app — and `useStackLanding`, which animates by hand — reads this
 * attribute instead, so the switch the learner threw damps the same things the OS setting does.
 */
export function useDeviceMotion(asked: boolean): void {
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
}
