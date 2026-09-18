import { vi } from 'vitest'
import type { ExtensionContext, ExtensionManifest } from '@/shared/lib'
import type { Preferences } from '@/entities/preferences'
import { preferencesStoreHolding } from '@/entities/preferences/testing/stored-preferences'
import type { LoadedExtension } from '../load-extensions'

export const FAKE_MESSAGES = { label: 'Fake', description: 'A fake extension' }

/** A manifest with every loader resolved, and one import row keyed into its namespace. */
export function fakeManifest(overrides: Partial<ExtensionManifest> = {}): ExtensionManifest {
  return {
    id: 'fake',
    icon: <span />,
    labelKey: 'fake:label',
    descriptionKey: 'fake:description',
    namespace: 'fake',
    loadMessages: () => Promise.resolve(FAKE_MESSAGES),
    routes: [],
    loadRuntime: () => Promise.resolve({ activate: fakeActivate() }),
    contributions: {
      importOptions: [
        {
          id: 'fake',
          icon: null,
          titleKey: 'fake:label',
          subtitleKey: 'fake:description',
          to: '/import/fake',
        },
      ],
    },
    ...overrides,
  }
}

/** An `activate` that publishes a fresh services object each time and records its deactivations. */
export function fakeActivate() {
  const deactivate = vi.fn()
  let activations = 0
  const activate = vi.fn((_context: ExtensionContext) => ({
    services: { activation: ++activations },
    deactivate,
  }))
  return Object.assign(activate, { deactivate })
}

export function loaded(manifest = fakeManifest(), activate = fakeActivate()): LoadedExtension {
  return { manifest, activate }
}

/** A started preferences store holding `extensions`, or holding nothing at all when null. */
export function preferencesWith(extensions: string[] | null, overrides: Partial<Preferences> = {}) {
  return preferencesStoreHolding(extensions === null ? null : { ...overrides, extensions })
}
