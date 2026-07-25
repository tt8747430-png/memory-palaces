import { useCallback, useRef } from 'react'

/** The point a landing flies from — the top-left of the stack at the moment it was released. */
export interface StackOrigin {
  top: number
  left: number
}

export interface StackLanding {
  /**
   * Ref for the element a row should fly *as*. Attach it to a wrapper the drag library does not
   * write to — dnd-kit owns the sortable node's own `transform`, and animating that same element
   * fights it.
   */
  register: (id: string) => (node: HTMLElement | null) => void
  /** Call from `onDragEnd` with where the stack was and which rows it was carrying. */
  land: (origin: StackOrigin | null | undefined, ids: readonly string[]) => void
}

/** Long enough to read as travel, short enough that the list is settled before the next tap. */
const MIN_MS = 240
const MAX_MS = 420
const MS_PER_PX = 0.25
/** Rows arrive top-to-bottom, a few frames apart, so a dropped block reads as dealt not pasted. */
const STAGGER_MS = 18
const MAX_STAGGER_MS = 90
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * The other half of a stacked multi-drag: putting the carried rows back down.
 *
 * While the drag is live every carried row is in one pile under the finger, so the instant it is
 * released they all have to *travel* from that pile to the slots they landed in. Without it they
 * simply blink into place several rows apart and the stack reads as a lie — nothing connects the
 * thing that was in hand to the rows that appeared.
 *
 * This is a FLIP against a single known origin: the drop is committed to state first, and once
 * the new order has painted each row is offset back to where the stack was and released. Nothing
 * re-renders — the animations run on the compositor through the Web Animations API — so the
 * landing costs the same whether two rows came down or twenty.
 *
 * Honours `prefers-reduced-motion` by not animating at all: the rows are already in the right
 * places, the travel is the only thing dropped.
 */
export function useStackLanding(): StackLanding {
  const nodes = useRef(new Map<string, HTMLElement>())

  const register = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      if (node) nodes.current.set(id, node)
      else nodes.current.delete(id)
    },
    [],
  )

  const land = useCallback((origin: StackOrigin | null | undefined, ids: readonly string[]) => {
    if (!origin || ids.length === 0) return
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // The rows have not moved yet — the drop is a state update that has still to paint. Measure
    // on the next frame, when they are standing in their new slots.
    requestAnimationFrame(() => {
      ids.forEach((id, index) => {
        const node = nodes.current.get(id)
        if (!node?.isConnected || typeof node.animate !== 'function') return

        const rect = node.getBoundingClientRect()
        const dx = origin.left - rect.left
        const dy = origin.top - rect.top
        const distance = Math.hypot(dx, dy)
        // A row that landed where the stack already was has nothing to travel.
        if (distance < 1) return

        node.animate(
          [
            { transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.97)`, opacity: 0.6 },
            { transform: 'none', opacity: 1 },
          ],
          {
            duration: Math.min(MAX_MS, MIN_MS + distance * MS_PER_PX),
            delay: Math.min(MAX_STAGGER_MS, index * STAGGER_MS),
            easing: EASE_OUT,
            fill: 'backwards',
          },
        )
      })
    })
  }, [])

  return { register, land }
}
