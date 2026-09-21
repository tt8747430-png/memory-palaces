import { afterEach, describe, expect, it } from 'vitest'
import { claimBottomInset } from './bottom-dock'

const inset = () => document.documentElement.style.getPropertyValue('--app-bottom-inset')

afterEach(() => {
  document.documentElement.style.removeProperty('--app-bottom-inset')
})

describe('claimBottomInset', () => {
  it('opens the slot on the first claim and closes it on the last release', () => {
    const release = claimBottomInset()
    expect(inset()).toContain('4rem')
    release()
    expect(inset()).toBe('')
  })

  it('keeps the slot open while two occupants cross-fade, whichever leaves first', () => {
    const nav = claimBottomInset()
    const toolbar = claimBottomInset()

    // The nav fades out while the toolbar has already arrived: nothing beneath them may move.
    nav()
    expect(inset()).toContain('4rem')

    toolbar()
    expect(inset()).toBe('')
  })

  it('counts a release once, however many times it is called', () => {
    const first = claimBottomInset()
    const second = claimBottomInset()

    first()
    first()
    expect(inset()).toContain('4rem')

    second()
    expect(inset()).toBe('')
  })
})
