import { type ReactNode, useSyncExternalStore } from 'react'

export type OverlayResolver<R> = (value: R) => void

interface Entry {
  id: number
  node: ReactNode
}

let entries: Entry[] = []
const listeners = new Set<() => void>()
let nextId = 1

function emit() {
  for (const l of [...listeners]) l()
}

/**
 * Mounts `render(resolve)` into the OverlayHost and returns a promise that settles when the
 * mounted component calls `resolve`. The entry unmounts on resolve. Generic over the result type
 * `R`, so `openConfirmDialog` resolves `boolean`, `openMoveDeckDrawer` resolves a destination, etc.
 */
export function openOverlay<R>(render: (resolve: OverlayResolver<R>) => ReactNode): Promise<R> {
  return new Promise<R>((resolvePromise) => {
    const id = nextId++
    const resolve: OverlayResolver<R> = (value) => {
      entries = entries.filter((e) => e.id !== id)
      emit()
      resolvePromise(value)
    }
    entries = [...entries, { id, node: render(resolve) }]
    emit()
  })
}

export function OverlayHost() {
  const snapshot = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => entries,
    () => entries,
  )
  return (
    <>
      {snapshot.map((e) => (
        <div key={e.id}>{e.node}</div>
      ))}
    </>
  )
}
