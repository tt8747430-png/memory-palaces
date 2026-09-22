import { describe, expect, it } from 'vitest'
import { useBottomSlotStore } from './bottom-slot'

describe('bottom slot', () => {
  it('is wanted while any occupant asks for it, and free once the last lets go', () => {
    const first = useBottomSlotStore.getState().want()
    const second = useBottomSlotStore.getState().want()
    expect(useBottomSlotStore.getState().wanted).toBe(2)

    first()
    expect(useBottomSlotStore.getState().wanted).toBe(1)
    second()
    expect(useBottomSlotStore.getState().wanted).toBe(0)
  })

  it('counts a release once, however many times it is called', () => {
    const release = useBottomSlotStore.getState().want()
    release()
    release()
    expect(useBottomSlotStore.getState().wanted).toBe(0)
  })

  it('remembers where the dock is, so an occupant can render into it', () => {
    const node = document.createElement('div')
    useBottomSlotStore.getState().setTarget(node)
    expect(useBottomSlotStore.getState().target).toBe(node)
    useBottomSlotStore.getState().setTarget(null)
    expect(useBottomSlotStore.getState().target).toBeNull()
  })
})
