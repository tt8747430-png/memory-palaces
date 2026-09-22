import { afterEach, describe, expect, it } from 'vitest'
import { claimBottomInset } from './bottom-dock'

const inset = () => document.documentElement.style.getPropertyValue('--app-bottom-inset')

afterEach(() => {
  document.documentElement.style.removeProperty('--app-bottom-inset')
})

describe('claimBottomInset', () => {
  it('opens the slot on claim and closes it on release', () => {
    const release = claimBottomInset()
    expect(inset()).toContain('4rem')
    release()
    expect(inset()).toBe('')
  })
})
