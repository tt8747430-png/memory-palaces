import { useMemo } from 'react'
import { useSearch } from '@tanstack/react-router'
import type { StudyFilter } from '@/features/review'

/** What a study link may carry: the card to open on, and the set to study. */
export interface StudySearch {
  from?: string
  filter?: StudyFilter['kind']
}

const FILTER_KINDS: readonly StudyFilter['kind'][] = ['all', 'due', 'new', 'learning', 'flagged']

export function validateStudySearch(search: Record<string, unknown>): StudySearch {
  const from = typeof search.from === 'string' && search.from ? search.from : undefined
  const kind = FILTER_KINDS.find((each) => each === search.filter)
  return { from, filter: kind }
}

export function studyFilterFrom(search: StudySearch): StudyFilter | undefined {
  return search.filter ? { kind: search.filter } : undefined
}

export interface RecoverySearch {
  recovery?: boolean
}

export function validateRecoverySearch(search: Record<string, unknown>): RecoverySearch {
  const { recovery } = search
  return recovery === true || recovery === '1' || recovery === 'true' ? { recovery: true } : {}
}

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
