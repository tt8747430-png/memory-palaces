import { useCallback, useEffect, useMemo, useState } from 'react'

/** `null` and `undefined` both mean "no parent / no folder" — compare them as one. */
const same = (a: unknown, b: unknown): boolean => (a ?? null) === (b ?? null)

/**
 * Holds a just-dropped change on screen until persistence agrees with it.
 *
 * A drop is persisted as several independent writes — one per reordered row,
 * plus the moved row's new parent — so the store re-emits *partial* states on
 * the way to the final one (the row reparented but not yet reordered, half the
 * group at its new index). Rendering those intermediate emissions is what makes
 * a dropped row jump back and forth. This keeps the dropped state as an overlay
 * on every emission and releases it only once the stored rows match, so the list
 * settles exactly where the finger left it — and a write that never lands still
 * reconciles back to the truth on device.
 */
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
    // The reconcile step: releasing the patch is the whole point of the effect, and it can only
    // run once the stored rows have caught up. Restructuring it away would reintroduce flicker.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

/** The common case: a manual reorder, as a patch of each row's `order`. */
export function orderPatch<T extends { order: number }>(
  orderedIds: string[],
): Map<string, Partial<T>> {
  return new Map(orderedIds.map((id, index) => [id, { order: index } as Partial<T>]))
}
