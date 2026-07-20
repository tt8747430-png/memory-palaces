import { useEffect, useState } from 'react'

/** A coarse wall clock for due-count and streak arithmetic.
 *
 *  `main` reads `Date.now()` during render, so its values self-heal on any interaction.
 *  `react-hooks/purity` forbids that here, and sampling once at mount is not equivalent:
 *  a backgrounded PWA never unmounts, so due badges and the streak ring would stay stale
 *  indefinitely. This resyncs on a coarse interval and whenever the tab becomes visible
 *  again — the visibility hook matters because background timers are throttled hard.
 *
 *  Ticking re-renders the subscriber, which is strictly less churn than `main`'s
 *  every-render resample, so it is safe on drag-heavy screens. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const sync = () => setNow(Date.now())
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') sync()
    }
    const timer = setInterval(sync, intervalMs)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [intervalMs])

  return now
}
