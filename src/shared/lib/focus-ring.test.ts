import { describe, expect, it } from 'vitest'
import { readStylesheet } from '@/shared/test/stylesheet'
import { FOCUS_RING_OVERSHOOT } from './focus-ring'

describe('FOCUS_RING_OVERSHOOT', () => {
  it('is the distance theme.css draws the :focus-visible ring outside a control', () => {
    const theme = readStylesheet('theme.css')
    const block = theme.match(/:focus-visible\s*\{([^}]*)\}/)?.[1] ?? ''
    const width = Number(block.match(/outline:\s*(\d+)px/)?.[1])
    const offset = Number(block.match(/outline-offset:\s*(\d+)px/)?.[1])
    expect(width + offset).toBe(FOCUS_RING_OVERSHOOT)
  })
})
