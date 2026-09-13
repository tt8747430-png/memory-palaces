import { useCallback, useEffect, useMemo, useRef } from 'react'

/**
 * Why a surface lost the finger. A tap on empty space is the learner putting the row down — it can
 * settle back on a spring. Another surface taking over is not: the new one is already moving under
 * the same finger, and two rows springing at once is the flicker this registry exists to end.
 */
export type ReleaseReason = 'claimed' | 'outside'

/**
 * What a swipe surface marks itself with. The registry reads it to tell "the learner tapped away"
 * from "another surface is taking this touch", which is the whole difference between a spring and
 * a jump. Every surface wears it, because it is carried by the `surface` bundle below and there is
 * no way to register without it.
 */
export const SWIPE_SURFACE_ATTR = 'data-swipe-surface'

interface Holder {
  id: symbol
  /** The surface's own element. `null` only before its ref has been attached. */
  node: HTMLElement | null
  release: (reason: ReleaseReason) => void
}

let holder: Holder | null = null
let listening = false

function onPointerDownCapture(event: PointerEvent) {
  const current = holder
  if (!current?.node) return
  const target = event.target as Element | null
  if (target && current.node.contains(target)) return
  releaseHolder(current, target?.closest(`[${SWIPE_SURFACE_ATTR}]`) ? 'claimed' : 'outside')
}

function listen() {
  if (listening || !holder?.node) return
  // Capture: the touch that takes a row over has to find the previous one already released, or the
  // two overlap for exactly as long as a spring lasts.
  document.addEventListener('pointerdown', onPointerDownCapture, true)
  listening = true
}

function unlisten() {
  if (!listening) return
  document.removeEventListener('pointerdown', onPointerDownCapture, true)
  listening = false
}

function releaseHolder(current: Holder, reason: ReleaseReason) {
  if (holder !== current) return
  holder = null
  unlisten()
  current.release(reason)
}

/**
 * One surface owns the finger at a time. A surface claims on the gesture that moves it and holds
 * the claim for as long as it stays displaced — an open tray, a card mid-throw — so whatever the
 * next touch lands on can put it back where it was before moving itself.
 */
export function holdGesture(
  id: symbol,
  node: HTMLElement | null,
  release: (reason: ReleaseReason) => void,
) {
  if (holder && holder.id !== id) releaseHolder(holder, 'claimed')
  holder = { id, node, release }
  listen()
}

/** Give the claim up quietly — the surface has already put itself back. */
export function dropGesture(id: symbol) {
  if (holder?.id !== id) return
  holder = null
  unlisten()
}

export interface SurfaceProps {
  ref: (node: HTMLElement | null) => void
  [SWIPE_SURFACE_ATTR]: ''
}

export interface GestureHold {
  /**
   * Spread on the element the finger lands on. It is one bundle and not two steps because the mark
   * and the node answer the same question — is this touch a takeover or a tap away — and a surface
   * that registered without marking itself made every takeover read as a tap away.
   */
  surface: SurfaceProps
  /** Claim the finger. */
  hold: () => void
  drop: () => void
}

/**
 * `onRelease` must be idempotent: a surface can be asked to put itself back when it already has.
 */
export function useGestureHold(onRelease: (reason: ReleaseReason) => void): GestureHold {
  const id = useRef<symbol | null>(null)
  id.current ??= Symbol('gesture-hold')
  const token = id.current

  const node = useRef<HTMLElement | null>(null)
  const latest = useRef(onRelease)
  useEffect(() => {
    latest.current = onRelease
  })

  // An unmounting surface owns nothing, and running its release would set state on a component
  // that is gone.
  useEffect(() => () => dropGesture(token), [token])

  const hold = useCallback(() => {
    holdGesture(token, node.current, (reason) => latest.current(reason))
  }, [token])
  const drop = useCallback(() => dropGesture(token), [token])

  const surface = useMemo<SurfaceProps>(
    () => ({
      ref: (el: HTMLElement | null) => {
        node.current = el
      },
      [SWIPE_SURFACE_ATTR]: '',
    }),
    [],
  )

  return { surface, hold, drop }
}
