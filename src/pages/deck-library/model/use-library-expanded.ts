import { useOptimistic, useTransition } from 'react'
import { selectIsReady, toggleInSet } from '@/shared/lib'
import {
  selectLibraryExpanded,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'

export interface LibraryExpanded {
  /** The account's open rows have loaded — before, every row would show closed and then jump. */
  ready: boolean
  /** The Library rows left open, by deck id. They follow the account. */
  expanded: ReadonlySet<string>
  toggleExpanded: (id: string) => void
  expand: (id: string) => void
}

/**
 * A toggle shows at once — React's optimistic state stands in for the stored set until the write
 * lands, and a rapid second toggle builds on the first. A write that fails leaves the optimistic
 * state with its transition, so the rows show what was actually kept.
 */
export function useLibraryExpanded(): LibraryExpanded {
  const ready = usePreferencesStore(selectIsReady)
  const stored = usePreferencesStore(selectLibraryExpanded)
  const store = usePreferencesStoreApi()
  const [expanded, show] = useOptimistic<ReadonlySet<string>, ReadonlySet<string>>(
    new Set(stored),
    (_current, next) => next,
  )
  const [, startTransition] = useTransition()

  const commit = (next: ReadonlySet<string>) =>
    startTransition(async () => {
      show(next)
      try {
        await setPreferences(store, { libraryExpanded: [...next] })
      } catch {
        // Nothing to undo: the optimistic set ends with the transition.
      }
    })

  return {
    ready,
    expanded,
    toggleExpanded: (id) => commit(toggleInSet(expanded, id)),
    expand: (id) => {
      if (!expanded.has(id)) commit(new Set(expanded).add(id))
    },
  }
}
