import { useCallback, useMemo, useState } from 'react'
import { impact } from './haptics'

export interface MultiSelect {
  active: boolean
  ids: ReadonlySet<string>
  count: number
  allSelected: boolean
  has: (id: string) => boolean
  begin: (id: string) => void
  toggle: (id: string) => void
  toggleAll: () => void
  exit: () => void
  setVisibleIds: (ids: readonly string[]) => void
}

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
