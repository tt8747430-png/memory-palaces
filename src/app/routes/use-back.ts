import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import type { RoutePath } from '@/shared/config/routes'

/**
 * Back means back: pop the history entry the learner actually came from. Only when there is
 * nothing to pop — a deep link, a reload — does it fall through to the route's logical parent.
 */
export function useBack(fallback: () => void): () => void {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return () => {
    if (canGoBack) router.history.back()
    else fallback()
  }
}

/** The common case: back, or up to a fixed parent route. */
export function useBackTo(to: RoutePath): () => void {
  const navigate = useNavigate()
  return useBack(() => void navigate({ to }))
}
