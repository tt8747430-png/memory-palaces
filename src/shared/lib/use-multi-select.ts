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

export interface MultiSelectOptions {
  /**
   * The ids moving with the one the user touched — a deck carries its subdecks, a card carries only
   * itself. Must be stable across renders.
   */
  expand?: (id: string) => readonly string[]
}

const itself = (id: string): readonly string[] => [id]

export function useMultiSelect({ expand = itself }: MultiSelectOptions = {}): MultiSelect {
  const [active, setActive] = useState(false)
  const [ids, setIds] = useState<ReadonlySet<string>>(() => new Set())
  const [visible, setVisible] = useState<readonly string[]>([])

  const setVisibleIds = useCallback((next: readonly string[]) => {
    setVisible((prev) =>
      prev.length === next.length && prev.every((id, i) => id === next[i]) ? prev : next,
    )
  }, [])

  const allSelected = visible.length > 0 && visible.every((id) => ids.has(id))

  const begin = useCallback(
    (id: string) => {
      impact()
      setActive(true)
      setIds((prev) => {
        const next = new Set(prev)
        for (const each of expand(id)) next.add(each)
        return next
      })
    },
    [expand],
  )

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) => {
        const group = expand(id)
        const next = new Set(prev)
        if (group.every((each) => next.has(each))) for (const each of group) next.delete(each)
        else for (const each of group) next.add(each)
        return next
      })
    },
    [expand],
  )

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
