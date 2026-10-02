import { afterEach, describe, expect, it, vi } from 'vitest'
import { forgetRetiredDeviceKeys, RETIRED_DEVICE_KEYS } from './forget-retired-device-keys'

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('forgetRetiredDeviceKeys', () => {
  it('clears every key nothing reads any more, and leaves the rest of the device alone', () => {
    for (const key of RETIRED_DEVICE_KEYS) localStorage.setItem(key, '{"standalone":59}')
    localStorage.setItem('mindscape:theme', 'dark')

    forgetRetiredDeviceKeys()

    for (const key of RETIRED_DEVICE_KEYS) expect(localStorage.getItem(key)).toBeNull()
    expect(localStorage.getItem('mindscape:theme')).toBe('dark')
  })

  it('never fails a launch on storage that cannot be written', () => {
    vi.stubGlobal('localStorage', {
      removeItem: () => {
        throw new DOMException('The operation is insecure.', 'SecurityError')
      },
    })

    expect(() => forgetRetiredDeviceKeys()).not.toThrow()
  })
})
