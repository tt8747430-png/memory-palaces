import { type Dispatch, type SetStateAction, useCallback, useState } from 'react'

function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((v): v is string => typeof v === 'string'))
  } catch {
    return new Set()
  }
}

/**
 * A set of string ids that survives app restarts. Mirrors the
 * `useState<ReadonlySet<string>>` API — including functional updates — so callers
 * keep writing `setX((prev) => new Set(prev).add(id))`; every change is persisted
 * to `localStorage[key]` as a JSON array.
 *
 * For UI *view* state only (e.g. which tree nodes are expanded). Domain data
 * belongs in RxDB, never here.
 */
export function usePersistedSet(
  key: string,
): [ReadonlySet<string>, Dispatch<SetStateAction<ReadonlySet<string>>>] {
  const [set, setSet] = useState<ReadonlySet<string>>(() => readSet(key))

  const update = useCallback<Dispatch<SetStateAction<ReadonlySet<string>>>>(
    (action) => {
      setSet((prev) => {
        const next =
          typeof action === 'function'
            ? (action as (p: ReadonlySet<string>) => ReadonlySet<string>)(prev)
            : action
        try {
          localStorage.setItem(key, JSON.stringify([...next]))
        } catch {
          // storage unavailable or full — keep the in-memory value
        }
        return next
      })
    },
    [key],
  )

  return [set, update]
}
