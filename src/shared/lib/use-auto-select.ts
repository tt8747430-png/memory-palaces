import { type FocusEvent, useCallback, useEffect, useRef } from 'react'

/**
 * Selects a field's contents the first time it is focused while `active`.
 *
 * Forms that open pre-filled with a suggested default ("New Deck", "New Folder")
 * should let the learner type straight over it — so the autofocused field opens
 * with its text selected, exactly like renaming a file. Selecting only on the
 * first focus keeps a later tab-away/tab-back from re-selecting under the caret;
 * closing the surface (`active` → false) re-arms it for the next open.
 *
 * Pair with `autoFocus` on the same element: the browser focuses it, `onFocus`
 * runs the selection.
 */
export function useAutoSelect<T extends HTMLInputElement | HTMLTextAreaElement>(active: boolean) {
  const done = useRef(false)

  useEffect(() => {
    if (!active) done.current = false
  }, [active])

  return useCallback(
    (event: FocusEvent<T>) => {
      if (!active || done.current) return
      done.current = true
      event.currentTarget.select()
    },
    [active],
  )
}
