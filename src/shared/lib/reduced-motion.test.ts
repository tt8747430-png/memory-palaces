import { afterEach, describe, expect, it } from 'vitest'
import { readReducedMotion } from './reduced-motion'

afterEach(() => {
  delete document.documentElement.dataset.reducedMotion
})

describe('readReducedMotion', () => {
  it('reads the attribute the app keeps, so the learner’s own switch counts', () => {
    document.documentElement.dataset.reducedMotion = 'reduce'
    expect(readReducedMotion()).toBe(true)
  })

  it('answers no while nothing has asked for damping', () => {
    document.documentElement.dataset.reducedMotion = 'system'
    expect(readReducedMotion()).toBe(false)
  })

  it('answers no before the attribute is there at all', () => {
    expect(readReducedMotion()).toBe(false)
  })
})
