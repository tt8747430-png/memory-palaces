import { useCallback } from 'react'
import { useNavigate } from 'react-router'

/**
 * A back handler for drill-down pages: pop the history entry the user actually came from, or
 * fall back to a canonical parent when there is none (deep link, PWA cold start, share target).
 *
 * `main` asked TanStack for `useCanGoBack()`; React Router has no such hook, so we read the
 * `idx` it stamps into `window.history.state` on every push — index 0 means this entry is the
 * bottom of the stack and `navigate(-1)` would leave the app.
 */
export function useBack(fallback: string): () => void {
  const navigate = useNavigate()

  return useCallback(() => {
    const idx: unknown = window.history.state?.idx
    if (typeof idx === 'number' && idx > 0) void navigate(-1)
    else void navigate(fallback, { replace: true, viewTransition: true })
  }, [navigate, fallback])
}
