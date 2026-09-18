import { afterEach, describe, expect, it } from 'vitest'
import { i18n } from '@/shared/i18n'
import { loadExtensions } from './load-extensions'
import { FAKE_MESSAGES, fakeActivate, fakeManifest } from './testing/fake-extension'

afterEach(() => {
  i18n.removeResourceBundle('en', 'fake')
})

describe('loadExtensions', () => {
  it('adds every registered extension’s copy, on or off, and hands back its activate', async () => {
    const activate = fakeActivate()
    const [extension] = await loadExtensions([
      fakeManifest({ loadRuntime: () => Promise.resolve({ activate }) }),
    ])
    expect(i18n.getResourceBundle('en', 'fake')).toEqual(FAKE_MESSAGES)
    expect(extension?.activate).toBe(activate)
  })

  it('rejects when a chunk will not load — boot says so, rather than half an extension', async () => {
    await expect(
      loadExtensions([fakeManifest({ loadRuntime: () => Promise.reject(new Error('offline')) })]),
    ).rejects.toThrow('offline')
  })
})
