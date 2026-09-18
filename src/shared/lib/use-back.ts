import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import type { RoutePath } from '@/shared/config/routes'

/**
 * History back when there is any, the fallback otherwise — a cold deep link has no history, and
 * `back()` on one leaves the reader where they are. Lives here so an extension's screen, which
 * may not import `app`, goes back the same way a core screen does.
 */
export function useBack(fallback: () => void): () => void {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return () => {
    if (canGoBack) router.history.back()
    else fallback()
  }
}

export function useBackTo(to: RoutePath): () => void {
  const navigate = useNavigate()
  return useBack(() => void navigate({ to }))
}
