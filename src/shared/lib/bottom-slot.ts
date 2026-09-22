import { useLayoutEffect } from 'react'
import { create } from 'zustand'

interface BottomSlotState {
  /** The dock's content layer, once it is on screen — where an occupant renders. */
  target: HTMLElement | null
  /** How many occupants are asking for the slot right now. Above zero, the nav stands aside. */
  wanted: number
  setTarget: (node: HTMLElement | null) => void
  /** Asks for the slot; returns the one release, which counts once however often it is called. */
  want: () => () => void
}

/**
 * The one slot at the bottom of the app is a box the nav lives in by default and lends out — to
 * a select toolbar, while a selection is on. This is the loan book: who has asked for the box,
 * and where the box is so they can render into it. The box itself never leaves the tree, which
 * is what makes the handover a change of contents rather than two bars trading places.
 */
export const useBottomSlotStore = create<BottomSlotState>((set) => ({
  target: null,
  wanted: 0,
  setTarget: (node) => set({ target: node }),
  want: () => {
    set((state) => ({ wanted: state.wanted + 1 }))
    let released = false
    return () => {
      if (released) return
      released = true
      set((state) => ({ wanted: Math.max(0, state.wanted - 1) }))
    }
  },
}))

export const useBottomSlotWanted = (): boolean => useBottomSlotStore((state) => state.wanted > 0)

export const useBottomSlotTarget = (): HTMLElement | null =>
  useBottomSlotStore((state) => state.target)

/** Asks for the slot while `open`, before paint — so the nav is never drawn under an arrival. */
export function useWantBottomSlot(open: boolean): void {
  useLayoutEffect(() => (open ? useBottomSlotStore.getState().want() : undefined), [open])
}
