import { useCallback, useMemo, useState } from 'react'
import { impact } from './haptics'

export interface MultiSelect {
  /** True while a selection is in progress — the surface swaps to its select chrome. */
  active: boolean
  ids: ReadonlySet<string>
  count: number
  /** Every id currently on screen is selected, so "select all" flips to "clear all". */
  allSelected: boolean
  has: (id: string) => boolean
  /** Start a selection from a press-and-hold, keeping anything already chosen. */
  begin: (id: string) => void
  toggle: (id: string) => void
  toggleAll: () => void
  exit: () => void
  /**
   * The rows the surface is showing right now — what "select all" covers. Sorting, searching
   * and filtering all live in the list, so the list is what reports what is on screen.
   */
  setVisibleIds: (ids: readonly string[]) => void
}

/**
 * Multi-selection for a single flat list: which rows are chosen, whether the mode is on, and
 * what "select all" means for the rows in view. The owning page holds it so its header can be
 * the selection's header — one bar, no second count rendered inside the list.
 */
export function useMultiSelect(): MultiSelect {
  const [active, setActive] = useState(false)
  const [ids, setIds] = useState<ReadonlySet<string>>(() => new Set())
  const [visible, setVisible] = useState<readonly string[]>([])

  const setVisibleIds = useCallback((next: readonly string[]) => {
    setVisible((prev) =>
      prev.length === next.length && prev.every((id, i) => id === next[i]) ? prev : next,
    )
  }, [])

  const allSelected = visible.length > 0 && visible.every((id) => ids.has(id))

  const begin = useCallback((id: string) => {
    impact()
    setActive(true)
    setIds((prev) => new Set(prev).add(id))
  }, [])

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setIds((prev) => {
      const next = new Set(prev)
      const everySelected = visible.length > 0 && visible.every((id) => next.has(id))
      for (const id of visible) {
        if (everySelected) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }, [visible])

  const exit = useCallback(() => {
    setActive(false)
    setIds(new Set())
  }, [])

  const has = useCallback((id: string) => ids.has(id), [ids])

  return useMemo(
    () => ({
      active,
      ids,
      count: ids.size,
      allSelected,
      has,
      begin,
      toggle,
      toggleAll,
      exit,
      setVisibleIds,
    }),
    [active, ids, allSelected, has, begin, toggle, toggleAll, exit, setVisibleIds],
  )
}
