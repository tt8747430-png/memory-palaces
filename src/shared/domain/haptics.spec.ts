import { afterEach, describe, expect, it, vi } from 'vitest'
import { impact, setHapticsEnabled } from './haptics'

afterEach(() => {
  setHapticsEnabled(true)
  vi.unstubAllGlobals()
})

describe('haptics', () => {
  it('vibrates through the Vibration API when enabled', () => {
    const vibrate = vi.fn()
    vi.stubGlobal('navigator', { vibrate })
    setHapticsEnabled(true)
    impact()
    expect(vibrate).toHaveBeenCalled()
  })

  it('stays silent when disabled', () => {
    const vibrate = vi.fn()
    vi.stubGlobal('navigator', { vibrate })
    setHapticsEnabled(false)
    impact()
    expect(vibrate).not.toHaveBeenCalled()
  })
})
