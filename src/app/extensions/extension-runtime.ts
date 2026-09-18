import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Identifiable, Repository } from '@/shared/api'
import {
  type ActiveExtensions,
  type ExtensionContext,
  type ExtensionId,
  type ExtensionManifest,
  isExtensionActive,
  type PendingChangePort,
  whenStoreReady,
} from '@/shared/lib'
import { isExtensionEnabled, type PreferencesStore } from '@/entities/preferences'
import type { LoadedExtension } from './load-extensions'
import type { ExtensionRepositories } from './repositories'

export interface ExtensionRuntimeState {
  active: ActiveExtensions
}

export interface ExtensionRuntime {
  manifests: readonly ExtensionManifest[]
  store: StoreApi<ExtensionRuntimeState>
  /** Follows preferences from now on: switched on, an extension is activated; off, deactivated. */
  start: () => void
  stop: () => void
  /**
   * Resolves once preferences have loaded and the active set matches them — what a route guard
   * awaits. It brings the set up to date itself, so its answer never depends on which of two store
   * listeners happened to run first.
   */
  settled: () => Promise<void>
  isActive: (id: ExtensionId) => boolean
}

/**
 * Where extensions are switched on and off, outside React. `activate` is each extension's
 * composition root and `deactivate` is the whole of switching it off — so nothing an extension runs
 * depends on a component staying mounted, and nothing in the app remounts when one is toggled.
 */
export function createExtensionRuntime({
  extensions,
  preferences,
  repositories,
  pending,
}: {
  extensions: readonly LoadedExtension[]
  preferences: PreferencesStore
  repositories: ExtensionRepositories
  /** The pending-change port for a contributed collection, by its key. */
  pending: (key: string) => PendingChangePort
}): ExtensionRuntime {
  const store = createStore<ExtensionRuntimeState>(() => ({ active: {} }))
  const deactivations = new Map<ExtensionId, () => void>()
  let unsubscribe: (() => void) | null = null

  // The extension knows its entity type and `app` cannot: the one cast between them lives here.
  const context: ExtensionContext = {
    repository: <T extends Identifiable>(key: string): Repository<T> => {
      const held = repositories[key]
      if (!held) throw new Error(`No repository was built for the extension collection ${key}`)
      return held as Repository<T>
    },
    pending,
  }

  /** Brings the active set up to date with preferences. Before they load it decides nothing. */
  const follow = () => {
    const { status, preferences: stored } = preferences.getState()
    if (status !== 'ready') return
    const enabled = { extensions: stored?.extensions ?? [] }
    const active: Record<ExtensionId, unknown> = { ...store.getState().active }
    let changed = false
    for (const { manifest, activate } of extensions) {
      const on = isExtensionEnabled(enabled, manifest.id)
      const deactivate = deactivations.get(manifest.id)
      if (on && !deactivate) {
        const activation = activate(context)
        deactivations.set(manifest.id, activation.deactivate)
        active[manifest.id] = activation.services
        changed = true
      } else if (!on && deactivate) {
        deactivate()
        deactivations.delete(manifest.id)
        delete active[manifest.id]
        changed = true
      }
    }
    if (changed) store.setState({ active })
  }

  return {
    manifests: extensions.map((extension) => extension.manifest),
    store,
    start: () => {
      if (unsubscribe) return
      unsubscribe = preferences.subscribe(follow)
      follow()
    },
    stop: () => {
      unsubscribe?.()
      unsubscribe = null
      for (const deactivate of deactivations.values()) deactivate()
      deactivations.clear()
      store.setState({ active: {} })
    },
    settled: async () => {
      await whenStoreReady(preferences)
      follow()
    },
    isActive: (id) => isExtensionActive(store.getState().active, id),
  }
}
