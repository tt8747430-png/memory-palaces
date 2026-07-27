import { useCallback, useEffect, useMemo, useState } from 'react'

const same = (a: unknown, b: unknown): boolean => (a ?? null) === (b ?? null)

export function useOptimisticPatch<T extends { id: string }>(
  items: T[],
): [patched: T[], applyPatch: (patches: Map<string, Partial<T>>) => void] {
  const [pending, setPending] = useState<Map<string, Partial<T>> | null>(null)

  useEffect(() => {
    if (!pending) return
    const settled = items.every((item) => {
      const patch = pending.get(item.id)
      if (!patch) return true
      return (Object.keys(patch) as (keyof T)[]).every((key) => same(item[key], patch[key]))
    })
    if (settled) setPending(null)
  }, [items, pending])

  const patched = useMemo(() => {
    if (!pending) return items
    return items.map((item) => {
      const patch = pending.get(item.id)
      return patch ? { ...item, ...patch } : item
    })
  }, [items, pending])

  const applyPatch = useCallback((patches: Map<string, Partial<T>>) => setPending(patches), [])

  return [patched, applyPatch]
}

export function orderPatch<T extends { order: number }>(
  orderedIds: string[],
): Map<string, Partial<T>> {
  return new Map(orderedIds.map((id, index) => [id, { order: index } as Partial<T>]))
}
