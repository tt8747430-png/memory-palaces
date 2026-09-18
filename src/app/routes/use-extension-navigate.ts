import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'

/**
 * Navigates to a path only an extension knows. TanStack types `to` against the route tree it was
 * built from, and a contributed path is not in that union at the call site, so the one cast that
 * reconnects them lives here rather than at every screen.
 */
export function useExtensionNavigate(): (to: string, search?: Record<string, unknown>) => void {
  const navigate = useNavigate()
  return useCallback((to, search) => void navigate({ to, search } as never), [navigate])
}
