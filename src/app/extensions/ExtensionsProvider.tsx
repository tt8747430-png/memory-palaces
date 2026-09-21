import { type ReactNode, useMemo } from 'react'
import { useStore } from 'zustand'
import {
  type ActiveExtensions,
  type ExtensionContributions,
  type ExtensionManifest,
  ExtensionPointsContext,
  ExtensionServicesContext,
  isExtensionActive,
} from '@/shared/lib'
import {
  isExtensionFeatureOn,
  type Preferences,
  selectDisabledFeatures,
  usePreferencesStore,
} from '@/entities/preferences'
import type { ExtensionRuntime } from './extension-runtime'

type FeatureSwitches = Pick<Preferences, 'disabledFeatures'>

/**
 * What the enabled extensions are offering right now. A contribution that names a feature is
 * withdrawn while that feature is off — a row for something the learner switched off would open a
 * screen they cannot reach.
 */
function mergeContributions(
  manifests: readonly ExtensionManifest[],
  active: ActiveExtensions,
  switches: FeatureSwitches,
): ExtensionContributions {
  const offered = (manifest: ExtensionManifest, feature: string | undefined) =>
    feature === undefined || isExtensionFeatureOn(switches, manifest.id, feature)
  return {
    importOptions: manifests
      .filter((manifest) => isExtensionActive(active, manifest.id))
      .flatMap((manifest) =>
        (manifest.contributions.importOptions ?? []).filter((option) =>
          offered(manifest, option.feature),
        ),
      ),
  }
}

/**
 * Hands React what the runtime decided: each active extension's services, and what it contributes
 * to core surfaces. Both are context values over a tree whose shape never changes — toggling an
 * extension re-renders its readers and remounts nothing.
 */
export function ExtensionsProvider({
  runtime,
  children,
}: {
  runtime: ExtensionRuntime
  children: ReactNode
}) {
  const active = useStore(runtime.store, (state) => state.active)
  // The stored map's identity changes only when a switch is flipped, so this re-merges then and
  // never on an unrelated preference write.
  const disabledFeatures = usePreferencesStore(selectDisabledFeatures)
  const contributions = useMemo(
    () => mergeContributions(runtime.manifests, active, { disabledFeatures }),
    [runtime, active, disabledFeatures],
  )
  return (
    <ExtensionServicesContext value={active}>
      <ExtensionPointsContext value={contributions}>{children}</ExtensionPointsContext>
    </ExtensionServicesContext>
  )
}
