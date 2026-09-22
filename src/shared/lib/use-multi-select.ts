import { useCallback, useMemo, useState } from 'react'
import { impact } from './haptics'

export interface MultiSelect {
  active: boolean
  ids: ReadonlySet<string>
  count: number
  allSelected: boolean
  has: (id: string) => boolean
  begin: (id: string) => void
  /** Opens the mode with nothing selected yet. */
  enter: () => void
  toggle: (id: string) => void
  toggleAll: () => void
  exit: () => void
}

export interface MultiSelectOptions {
  expand?: (id: string) => readonly string[]
  /**
   * The rows the list shows right now — after its search and filter, not only the ones scrolled
   * into view. What "all" means for select-all. An input rather than something the list reports
   * back from an effect: reported, it started empty and the whole screen rendered a second time
   * the moment it arrived.
   */
  visibleIds?: readonly string[]
}

const itself = (id: string): readonly string[] => [id]

const NONE: readonly string[] = []

export function useMultiSelect({
  expand = itself,
  visibleIds: visible = NONE,
}: MultiSelectOptions = {}): MultiSelect {
  const [active, setActive] = useState(false)
  const [ids, setIds] = useState<ReadonlySet<string>>(() => new Set())

  const allSelected = useMemo(
    () => visible.length > 0 && visible.every((id) => ids.has(id)),
    [visible, ids],
  )

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

  const enter = useCallback(() => setActive(true), [])

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
      enter,
      toggle,
      toggleAll,
      exit,
    }),
    [active, ids, allSelected, has, begin, enter, toggle, toggleAll, exit],
  )
}
