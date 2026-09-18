import { useMemo } from 'react'
import { useSearch } from '@tanstack/react-router'

/**
 * Reads the current route's search the way its own `validateSearch` defines it.
 *
 * `useSearch({ from })` cannot narrow here: this router builds its tree from an
 * array rather than generated route files, so TanStack widens `from` to a union
 * of every route's search. Running the route's own validator over the raw
 * search earns the type back instead of asserting it, and keeps the reader and
 * the route's `validateSearch` from ever drifting apart.
 */
export function useRouteSearch<T>(validate: (search: Record<string, unknown>) => T): T {
  const search = useSearch({ strict: false })
  return useMemo(() => validate(search as Record<string, unknown>), [search, validate])
}
