import { useCallback, useRef } from 'react'

export interface StackOrigin {
  top: number
  left: number
}

export interface StackLanding {
  register: (id: string) => (node: HTMLElement | null) => void
  land: (origin: StackOrigin | null | undefined, ids: readonly string[]) => void
}

const MIN_MS = 240
const MAX_MS = 420
const MS_PER_PX = 0.25
const STAGGER_MS = 18
const MAX_STAGGER_MS = 90
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

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

    requestAnimationFrame(() => {
      ids.forEach((id, index) => {
        const node = nodes.current.get(id)
        if (!node?.isConnected || typeof node.animate !== 'function') return

        const rect = node.getBoundingClientRect()
        const dx = origin.left - rect.left
        const dy = origin.top - rect.top
        const distance = Math.hypot(dx, dy)
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
