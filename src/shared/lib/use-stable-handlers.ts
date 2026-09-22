import { useMemo } from 'react'
import { useLatest } from './use-latest'

type Handlers = Record<string, ((...args: never[]) => unknown) | undefined>

/**
 * The same handlers, in an object whose identity — and each function's — never changes, each
 * calling the latest version it was given. For callbacks a memoized row calls on a tap: built fresh
 * each render, they would re-render every row on every render of the list.
 *
 * Only which handlers are present is read at render time, so a row can still tell "no handler"
 * from "a handler". Never call one during render: it runs the version from the last commit.
 */
export function useStableHandlers<H extends Handlers>(handlers: H): H {
  const latest = useLatest(handlers)
  const present = Object.keys(handlers)
    .filter((key) => handlers[key] !== undefined)
    .join('|')

  return useMemo(() => {
    const stable: Record<string, (...args: never[]) => unknown> = {}
    for (const key of present.split('|').filter(Boolean)) {
      stable[key] = (...args: never[]) => latest.current[key]?.(...args)
    }
    return stable as H
  }, [present, latest])
}
