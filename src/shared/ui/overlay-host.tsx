import { type ReactNode, useCallback, useRef, useState, useSyncExternalStore } from 'react'

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

export interface OverlayController<R> {
  /** Whether the overlay should render open. Starts `true`; an action flips it via `close`. */
  open: boolean
  /**
   * Records `value` as the eventual result and starts the primitive's closing transition
   * (by flipping `open` to `false`). Idempotent — a second call while already closing is a no-op,
   * so a click that starts closing followed by an Escape keypress can't overwrite the result.
   */
  close: (value: R) => void
  /**
   * Wire directly to the primitive's `onOpenChangeComplete`. Once Base UI reports the closing
   * transition finished (`open === false`), this calls the overlay's `resolve` exactly once.
   */
  onOpenChangeComplete: (open: boolean) => void
}

/**
 * Two-phase close for overlays mounted via `openOverlay`: an action (confirm/cancel/pick/
 * backdrop-dismiss/escape) calls `close(value)`, which flips `open` to `false` so Base UI plays
 * its exit transition; `resolve` only runs once that transition completes and Base UI calls
 * `onOpenChangeComplete(false)`. This keeps dismissals from cutting instantly — the overlay
 * unmounts (via `openOverlay`'s `resolve`) only after it has finished animating away.
 *
 * Every `*Dialog`/`*Drawer` service built on `openOverlay` should consume this instead of calling
 * `resolve` directly, so the close-animation timing is centralized here rather than reimplemented
 * per overlay.
 */
export function useOverlayController<R>(resolve: OverlayResolver<R>): OverlayController<R> {
  const [open, setOpen] = useState(true)
  const valueRef = useRef<R | undefined>(undefined)
  const closingRef = useRef(false)
  const resolvedRef = useRef(false)

  const close = useCallback((value: R) => {
    if (closingRef.current) return
    closingRef.current = true
    valueRef.current = value
    setOpen(false)
  }, [])

  const onOpenChangeComplete = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen || resolvedRef.current) return
      resolvedRef.current = true
      resolve(valueRef.current as R)
    },
    [resolve],
  )

  return { open, close, onOpenChangeComplete }
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
