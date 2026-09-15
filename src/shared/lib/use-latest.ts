import { type RefObject, useLayoutEffect, useRef } from 'react'

/**
 * A ref that always holds the newest `value`, for a callback that has to stay one identity — a
 * store subscription, a Realtime handler, a window listener — while reading what is current.
 *
 * Written in a layout effect rather than during render: a render React throws away must not leave
 * its value behind, and the write has to land before any child effect that fires the callback.
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value)
  useLayoutEffect(() => {
    ref.current = value
  }, [value])
  return ref
}
