import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createPreferencesStore, type Preferences } from '@/entities/preferences'
import { setExtensionEnabled } from '@/features/preferences'
import { createExtensionRuntime } from './extension-runtime'
import { fakeActivate, fakeManifest, loaded, preferencesWith } from './testing/fake-extension'

const repositories = { fakeItems: new InMemoryRepository([]) }

function runtimeWith(preferences = preferencesWith(['fake']), activate = fakeActivate()) {
  const runtime = createExtensionRuntime({
    extensions: [loaded(fakeManifest(), activate)],
    preferences,
    repositories,
  })
  runtime.start()
  return { runtime, activate, preferences }
}

describe('createExtensionRuntime', () => {
  it('activates an enabled extension and publishes its services', () => {
    const { runtime, activate } = runtimeWith()
    expect(activate).toHaveBeenCalledTimes(1)
    expect(runtime.isActive('fake')).toBe(true)
    expect(runtime.store.getState().active).toEqual({ fake: { activation: 1 } })
  })

  it('leaves an extension that is off alone', () => {
    const { runtime, activate } = runtimeWith(preferencesWith([]))
    expect(activate).not.toHaveBeenCalled()
    expect(runtime.isActive('fake')).toBe(false)
  })

  it('decides nothing until preferences have loaded — unloaded is neither "off" nor "on"', async () => {
    const stored = preferencesWith(['fake']).getState().preferences!
    const preferences = createPreferencesStore(new InMemoryRepository<Preferences>([stored]))
    const { runtime, activate } = runtimeWith(preferences)
    expect(activate).not.toHaveBeenCalled()

    const settled = runtime.settled()
    preferences.getState().start()
    await settled
    expect(runtime.isActive('fake')).toBe(true)
  })

  it('treats no stored preferences as nothing switched on', async () => {
    const { runtime, activate } = runtimeWith(preferencesWith(null))
    await runtime.settled()
    expect(activate).not.toHaveBeenCalled()
  })

  it('hands the extension the repositories its collections were given', () => {
    const activate = fakeActivate()
    runtimeWith(preferencesWith(['fake']), activate)
    const context = activate.mock.calls[0]![0]
    expect(context.repository('fakeItems')).toBe(repositories.fakeItems)
    expect(() => context.repository('missing')).toThrow(/missing/)
  })

  it('deactivates on switch-off, and withdraws the services in the same update', async () => {
    const { runtime, activate, preferences } = runtimeWith()
    await setExtensionEnabled(preferences, 'fake', false)
    expect(activate.deactivate).toHaveBeenCalledTimes(1)
    expect(runtime.store.getState().active).toEqual({})
  })

  it('activates afresh on switch-on — never the services it stopped', async () => {
    const { runtime, activate, preferences } = runtimeWith()
    await setExtensionEnabled(preferences, 'fake', false)
    await setExtensionEnabled(preferences, 'fake', true)
    expect(activate).toHaveBeenCalledTimes(2)
    expect(activate.deactivate).toHaveBeenCalledTimes(1)
    expect(runtime.store.getState().active).toEqual({ fake: { activation: 2 } })
  })

  it('ignores a preferences change that leaves the extension where it was', async () => {
    const { runtime, activate, preferences } = runtimeWith()
    const before = runtime.store.getState().active
    await setExtensionEnabled(preferences, 'other', true)
    expect(activate).toHaveBeenCalledTimes(1)
    expect(runtime.store.getState().active).toBe(before)
  })

  it('stops everything it started', () => {
    const { runtime, activate } = runtimeWith()
    runtime.stop()
    expect(activate.deactivate).toHaveBeenCalledTimes(1)
    expect(runtime.isActive('fake')).toBe(false)
  })
})
