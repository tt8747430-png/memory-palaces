import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import type { RoutePath } from '@/shared/config/routes'

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
